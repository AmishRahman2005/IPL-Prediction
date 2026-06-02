import pandas as pd
import numpy as np
import os

TEAM_MAPPING = {
    'Delhi Daredevils': 'Delhi Capitals',
    'Kings XI Punjab': 'Punjab Kings',
    'Deccan Chargers': 'Sunrisers Hyderabad',
    'Royal Challengers Bangalore': 'Royal Challengers Bengaluru',
    'Rising Pune Supergiants': 'Rising Pune Supergiant',
    'Rising Pune Supergiant': 'Rising Pune Supergiant',
    'Pune Warriors': 'Pune Warriors',
    'Kochi Tuskers Kerala': 'Kochi Tuskers Kerala',
    'Gujarat Lions': 'Gujarat Lions',
    'Chennai Super Kings': 'Chennai Super Kings',
    'Mumbai Indians': 'Mumbai Indians',
    'Kolkata Knight Riders': 'Kolkata Knight Riders',
    'Rajasthan Royals': 'Rajasthan Royals',
    'Sunrisers Hyderabad': 'Sunrisers Hyderabad',
    'Delhi Capitals': 'Delhi Capitals',
    'Punjab Kings': 'Punjab Kings',
    'Lucknow Super Giants': 'Lucknow Super Giants',
    'Gujarat Titans': 'Gujarat Titans'
}

ACTIVE_TEAMS = [
    'Chennai Super Kings',
    'Mumbai Indians',
    'Royal Challengers Bengaluru',
    'Kolkata Knight Riders',
    'Rajasthan Royals',
    'Delhi Capitals',
    'Punjab Kings',
    'Sunrisers Hyderabad',
    'Lucknow Super Giants',
    'Gujarat Titans'
]

# Baseline stats for newer teams to avoid cold start issues (like LSG/GT)
TEAM_BASELINES = {
    'Chennai Super Kings': {'batting': 8.4, 'bowling': 8.2, 'stability': 9.0, 'captaincy': 9.5, 'all_rounder': 8.5},
    'Mumbai Indians': {'batting': 8.5, 'bowling': 8.3, 'stability': 8.5, 'captaincy': 9.0, 'all_rounder': 8.0},
    'Royal Challengers Bengaluru': {'batting': 8.6, 'bowling': 8.6, 'stability': 7.5, 'captaincy': 7.5, 'all_rounder': 7.8},
    'Kolkata Knight Riders': {'batting': 8.3, 'bowling': 8.1, 'stability': 8.0, 'captaincy': 8.5, 'all_rounder': 9.0},
    'Rajasthan Royals': {'batting': 8.2, 'bowling': 8.0, 'stability': 8.2, 'captaincy': 8.0, 'all_rounder': 8.2},
    'Delhi Capitals': {'batting': 8.1, 'bowling': 8.1, 'stability': 7.8, 'captaincy': 8.0, 'all_rounder': 7.5},
    'Punjab Kings': {'batting': 8.0, 'bowling': 8.3, 'stability': 7.0, 'captaincy': 7.0, 'all_rounder': 7.5},
    'Sunrisers Hyderabad': {'batting': 8.4, 'bowling': 8.0, 'stability': 7.8, 'captaincy': 8.2, 'all_rounder': 8.0},
    'Lucknow Super Giants': {'batting': 8.2, 'bowling': 8.1, 'stability': 8.0, 'captaincy': 8.0, 'all_rounder': 8.2},
    'Gujarat Titans': {'batting': 8.1, 'bowling': 7.9, 'stability': 8.2, 'captaincy': 8.5, 'all_rounder': 8.4}
}

HOME_CITIES = {
    'Chennai Super Kings': ['Chennai'],
    'Mumbai Indians': ['Mumbai'],
    'Royal Challengers Bengaluru': ['Bangalore', 'Bengaluru'],
    'Kolkata Knight Riders': ['Kolkata'],
    'Rajasthan Royals': ['Jaipur', 'Guwahati'],
    'Delhi Capitals': ['Delhi'],
    'Punjab Kings': ['Mohali', 'Dharamsala', 'Chandigarh', 'Mullanpur'],
    'Sunrisers Hyderabad': ['Hyderabad'],
    'Lucknow Super Giants': ['Lucknow'],
    'Gujarat Titans': ['Ahmedabad']
}

def clean_team_name(name):
    if pd.isna(name):
        return np.nan
    name_str = str(name).strip()
    return TEAM_MAPPING.get(name_str, name_str)

def get_is_home(team, city, venue):
    cities = HOME_CITIES.get(team, [])
    for c in cities:
        if pd.notna(city) and c.lower() in str(city).lower():
            return 1
        if pd.notna(venue) and c.lower() in str(venue).lower():
            return 1
    return 0

class IPLDataPipeline:
    def __init__(self, filepath="IPL.csv"):
        self.filepath = filepath
        self.df_raw = None
        self.df_matches = None
        self.team_season_stats = None
        self.champions = {}
        
    def load_and_clean_data(self):
        from backend.database import init_db, load_matches_from_db
        
        # Try loading from database first
        db_matches = load_matches_from_db()
        if not db_matches.empty:
            print("Loaded matches from SQLite database.")
            self.df_matches = db_matches
            # Calculate champions per season
            self.compute_champions()
            # Compute season statistics and rankings
            self.compute_season_stats()
            return

        if not os.path.exists(self.filepath):
            raise FileNotFoundError(f"Dataset file not found at {self.filepath}")
            
        print("Reading IPL dataset from CSV...")
        # Since the first column might be empty/index, read it
        self.df_raw = pd.read_csv(self.filepath, low_memory=False)
        
        # Clean columns
        print("Cleaning and standardizing team names...")
        self.df_raw['batting_team'] = self.df_raw['batting_team'].apply(clean_team_name)
        self.df_raw['bowling_team'] = self.df_raw['bowling_team'].apply(clean_team_name)
        self.df_raw['toss_winner'] = self.df_raw['toss_winner'].apply(clean_team_name)
        self.df_raw['match_won_by'] = self.df_raw['match_won_by'].apply(clean_team_name)
        self.df_raw['player_out'] = self.df_raw['player_out'].replace('NA', np.nan)
        
        # Extract season year
        def get_year(row):
            if pd.notna(row['year']):
                try:
                    return int(row['year'])
                except:
                    pass
            if pd.notna(row['date']):
                try:
                    return int(str(row['date']).split('-')[0])
                except:
                    pass
            return 2008 # default fallback
            
        self.df_raw['year'] = self.df_raw.apply(get_year, axis=1)
        
        # Extract match-level details
        print("Extracting match-level data...")
        matches = []
        grouped = self.df_raw.groupby('match_id')
        for match_id, group in grouped:
            first_row = group.iloc[0]
            date = first_row['date']
            year = int(first_row['year'])
            season = str(first_row['season'])
            stage = str(first_row['stage'])
            
            toss_winner = clean_team_name(first_row['toss_winner'])
            toss_decision = first_row['toss_decision']
            venue = first_row['venue']
            city = first_row['city']
            winner = clean_team_name(first_row['match_won_by'])
            win_outcome = first_row['win_outcome']
            result_type = first_row['result_type']
            
            # Innings-level runs and balls
            i1 = group[group['innings'] == 1]
            i2 = group[group['innings'] == 2]
            
            if i1.empty or i2.empty:
                continue
                
            team1 = clean_team_name(i1.iloc[0]['batting_team'])
            team2 = clean_team_name(i2.iloc[0]['batting_team'])
            
            runs_1 = i1['runs_total'].sum()
            runs_2 = i2['runs_total'].sum()
            
            wickets_1 = i1['player_out'].notna().sum()
            wickets_2 = i2['player_out'].notna().sum()
            
            balls_1 = len(i1[i1['valid_ball'] == 1])
            balls_2 = len(i2[i2['valid_ball'] == 1])
            
            matches.append({
                'match_id': match_id,
                'date': date,
                'year': year,
                'season': season,
                'stage': stage,
                'team1': team1,
                'team2': team2,
                'toss_winner': toss_winner,
                'toss_decision': toss_decision,
                'venue': venue,
                'city': city,
                'winner': winner,
                'win_outcome': win_outcome,
                'result_type': result_type,
                'team1_runs': runs_1,
                'team2_runs': runs_2,
                'team1_wickets': wickets_1,
                'team2_wickets': wickets_2,
                'team1_balls': balls_1,
                'team2_balls': balls_2
            })
            
        self.df_matches = pd.DataFrame(matches).sort_values(by='date').reset_index(drop=True)
        print(f"Extracted {len(self.df_matches)} clean matches.")
        
        # Calculate champions per season
        self.compute_champions()
        # Compute season statistics and rankings
        self.compute_season_stats()
        
        # Cache clean matches in database
        init_db(self.df_matches)
        
    def compute_champions(self):
        self.champions = {}
        for yr in self.df_matches['year'].unique():
            season_m = self.df_matches[self.df_matches['year'] == yr].sort_values(by='date')
            if not season_m.empty:
                # Find final
                final_m = season_m[season_m['stage'].astype(str).str.lower().str.contains('final')]
                if not final_m.empty:
                    self.champions[yr] = final_m.iloc[-1]['winner']
                else:
                    self.champions[yr] = season_m.iloc[-1]['winner']
                    
    def compute_season_stats(self):
        print("Computing season statistics and team rankings...")
        stats_list = []
        years = sorted(self.df_matches['year'].unique())
        
        for yr in years:
            season_m = self.df_matches[self.df_matches['year'] == yr]
            teams = set(season_m['team1'].unique()).union(season_m['team2'].unique())
            
            # Filter to check playoff qualification (Top 4 reach playoffs)
            # In IPL, playoffs are typically the last 4 matches. The teams playing in those matches are the top 4.
            playoff_matches = season_m[season_m['stage'].astype(str).str.lower().str.contains('playoff|qualifier|eliminator|semi-final|final')]
            playoff_teams = set()
            if not playoff_matches.empty:
                playoff_teams = set(playoff_matches['team1'].unique()).union(playoff_matches['team2'].unique())
            
            team_stats = {}
            for t in teams:
                team_stats[t] = {
                    'points': 0, 'wins': 0, 'losses': 0, 'matches': 0,
                    'runs_scored': 0, 'balls_faced': 0, 'wickets_lost': 0,
                    'runs_conceded': 0, 'balls_bowled': 0, 'wickets_taken': 0,
                    'reached_playoffs': 1 if t in playoff_teams else 0,
                    'reached_final': 0,
                    'won_championship': 1 if self.champions.get(yr) == t else 0
                }
            
            # Finalists
            final_matches = season_m[season_m['stage'].astype(str).str.lower().str.contains('final')]
            if not final_matches.empty:
                final_teams = set(final_matches.iloc[-1][['team1', 'team2']].values)
                for ft in final_teams:
                    if ft in team_stats:
                        team_stats[ft]['reached_final'] = 1
            else:
                # Chronological last match
                last_m = season_m.iloc[-1]
                for ft in [last_m['team1'], last_m['team2']]:
                    if ft in team_stats:
                        team_stats[ft]['reached_final'] = 1
            
            # Aggregate stats
            for idx, row in season_m.iterrows():
                t1, t2 = row['team1'], row['team2']
                winner = row['winner']
                
                if t1 in team_stats: team_stats[t1]['matches'] += 1
                if t2 in team_stats: team_stats[t2]['matches'] += 1
                
                if pd.isna(winner) or winner == 'NA' or winner == 'no result':
                    if t1 in team_stats: team_stats[t1]['points'] += 1
                    if t2 in team_stats: team_stats[t2]['points'] += 1
                elif winner == t1:
                    if t1 in team_stats:
                        team_stats[t1]['points'] += 2
                        team_stats[t1]['wins'] += 1
                    if t2 in team_stats:
                        team_stats[t2]['losses'] += 1
                elif winner == t2:
                    if t2 in team_stats:
                        team_stats[t2]['points'] += 2
                        team_stats[t2]['wins'] += 1
                    if t1 in team_stats:
                        team_stats[t1]['losses'] += 1
                
                # NRR components
                r1, r2 = row['team1_runs'], row['team2_runs']
                w1, w2 = row['team1_wickets'], row['team2_wickets']
                b1, b2 = row['team1_balls'], row['team2_balls']
                
                if t1 in team_stats:
                    team_stats[t1]['runs_scored'] += r1
                    team_stats[t1]['balls_faced'] += b1
                    team_stats[t1]['wickets_lost'] += w1
                    team_stats[t1]['runs_conceded'] += r2
                    team_stats[t1]['balls_bowled'] += b2
                    team_stats[t1]['wickets_taken'] += w2
                    
                if t2 in team_stats:
                    team_stats[t2]['runs_scored'] += r2
                    team_stats[t2]['balls_faced'] += b2
                    team_stats[t2]['wickets_lost'] += w2
                    team_stats[t2]['runs_conceded'] += r1
                    team_stats[t2]['balls_bowled'] += b1
                    team_stats[t2]['wickets_taken'] += w1
            
            # Compute NRR & Rank
            season_rank_list = []
            for t, stats in team_stats.items():
                of = 20.0 if stats['wickets_lost'] == 10 else stats['balls_faced'] / 6.0
                ob = 20.0 if stats['wickets_taken'] == 10 else stats['balls_bowled'] / 6.0
                
                rs_rate = stats['runs_scored'] / of if of > 0 else 0
                rc_rate = stats['runs_conceded'] / ob if ob > 0 else 0
                nrr = rs_rate - rc_rate
                
                stats['nrr'] = nrr
                stats['team'] = t
                stats['year'] = yr
                season_rank_list.append(stats)
                
            season_rank_df = pd.DataFrame(season_rank_list)
            if not season_rank_df.empty:
                # In standard league stages, points determine rank. Playoff matches don't affect league rank,
                # but we can rank based on points, then NRR, then adjust for playoff outcome
                season_rank_df = season_rank_df.sort_values(by=['points', 'nrr'], ascending=[False, False]).reset_index(drop=True)
                season_rank_df['rank'] = season_rank_df.index + 1
                stats_list.append(season_rank_df)
                
        self.team_season_stats = pd.concat(stats_list, ignore_index=True)
        print("Season statistics calculated.")

    def get_team_features_for_season(self, team, before_year):
        """
        Calculates all engineered team features up to (but not including) before_year.
        Allows dynamic state updating in the simulator.
        """
        baselines = TEAM_BASELINES.get(team, {'batting': 8.0, 'bowling': 8.0, 'stability': 7.5, 'captaincy': 7.5, 'all_rounder': 7.5})
        
        hist_stats = self.team_season_stats[(self.team_season_stats['team'] == team) & (self.team_season_stats['year'] < before_year)]
        hist_matches = self.df_matches[((self.df_matches['team1'] == team) | (self.df_matches['team2'] == team)) & (self.df_matches['year'] < before_year)]
        
        if hist_matches.empty:
            # Cold start (GT/LSG in 2022, or future new teams)
            return {
                'win_pct': 0.5,
                'total_matches': 0,
                'total_wins': 0,
                'playoffs_pct': 0.0,
                'finals_pct': 0.0,
                'championships': 0,
                'last_season_rank': 5,
                'last_3_seasons_avg_rank': 5.0,
                'last_5_seasons_avg_rank': 5.0,
                'recent_win_pct': 0.5,
                'batting_strength': baselines['batting'],
                'bowling_strength': baselines['bowling'],
                'all_rounder_score': baselines['all_rounder'],
                'captaincy_score': baselines['captaincy'],
                'stability_score': baselines['stability'],
                'nrr_avg': 0.0,
                'home_win_pct': 0.5,
                'away_win_pct': 0.5,
                'chase_success_rate': 0.5,
                'defend_success_rate': 0.5,
                'form_index': 0.5,
                'team_consistency': 8.0,
                'championship_momentum': 0.0
            }
            
        # 1. Historical Strength
        total_matches = len(hist_matches)
        total_wins = len(hist_matches[hist_matches['winner'] == team])
        win_pct = total_wins / total_matches if total_matches > 0 else 0.5
        
        playoffs = hist_stats['reached_playoffs'].sum()
        finals = hist_stats['reached_final'].sum()
        championships = hist_stats['won_championship'].sum()
        
        total_seasons = len(hist_stats)
        playoffs_pct = playoffs / total_seasons if total_seasons > 0 else 0.0
        finals_pct = finals / total_seasons if total_seasons > 0 else 0.0
        
        # 2. Recent Form
        recent_stats = hist_stats.sort_values(by='year', ascending=False)
        last_season_rank = recent_stats.iloc[0]['rank'] if len(recent_stats) >= 1 else 5
        last_3_seasons_avg_rank = recent_stats.iloc[:3]['rank'].mean() if len(recent_stats) >= 1 else 5.0
        last_5_seasons_avg_rank = recent_stats.iloc[:5]['rank'].mean() if len(recent_stats) >= 1 else 5.0
        
        # Win pct in last 2 seasons
        recent_matches = hist_matches.sort_values(by='date', ascending=False).head(28)
        recent_wins = len(recent_matches[recent_matches['winner'] == team])
        recent_win_pct = recent_wins / len(recent_matches) if not recent_matches.empty else 0.5
        
        # 3. Quality Metrics
        # Derived batting and bowling strengths from previous 2 seasons
        recent_seasons = hist_stats.head(2)
        if not recent_seasons.empty:
            # Normalize to 5-10 scale
            # bat_rate is runs scored per over
            runs_scored = recent_seasons['runs_scored'].sum()
            matches_played = recent_seasons['matches'].sum()
            # Approximation
            bat_score = min(10.0, max(5.0, 6.0 + (runs_scored / (matches_played * 120.0)) * 1.5)) if matches_played > 0 else baselines['batting']
            
            runs_conceded = recent_seasons['runs_conceded'].sum()
            bowl_score = min(10.0, max(5.0, 10.0 - (runs_conceded / (matches_played * 120.0)) * 1.5)) if matches_played > 0 else baselines['bowling']
        else:
            bat_score = baselines['batting']
            bowl_score = baselines['bowling']
            
        all_rounder_score = baselines['all_rounder']
        stability_score = baselines['stability']
        
        # Captaincy score: factor titles won and recent performance
        captaincy_score = min(10.0, max(5.0, baselines['captaincy'] + (championships * 0.4) + (recent_win_pct - 0.5) * 2.0))
        
        # 4. Performance Metrics
        nrr_avg = hist_stats.head(3)['nrr'].mean() if not hist_stats.empty else 0.0
        
        # Home vs Away win pct
        # We classify home matches based on venue/city matches home cities list
        home_matches = hist_matches[hist_matches.apply(lambda r: get_is_home(team, r['city'], r['venue']), axis=1) == 1]
        away_matches = hist_matches[hist_matches.apply(lambda r: get_is_home(team, r['city'], r['venue']), axis=1) == 0]
        
        home_wins = len(home_matches[home_matches['winner'] == team])
        home_win_pct = home_wins / len(home_matches) if len(home_matches) > 0 else 0.5
        
        away_wins = len(away_matches[away_matches['winner'] == team])
        away_win_pct = away_wins / len(away_matches) if len(away_matches) > 0 else 0.5
        
        # Chase vs Defend success rate
        # Chase = team2 (bat second) and winner is team, or team1 (bat first) and winner is team
        defend_matches = hist_matches[hist_matches['team1'] == team]
        defend_wins = len(defend_matches[defend_matches['winner'] == team])
        defend_success_rate = defend_wins / len(defend_matches) if len(defend_matches) > 0 else 0.5
        
        chase_matches = hist_matches[hist_matches['team2'] == team]
        chase_wins = len(chase_matches[chase_matches['winner'] == team])
        chase_success_rate = chase_wins / len(chase_matches) if len(chase_matches) > 0 else 0.5
        
        # 5. Momentum Metrics
        # Form Index: win rate in last 5 matches
        last_5_matches = hist_matches.sort_values(by='date', ascending=False).head(5)
        form_index = len(last_5_matches[last_5_matches['winner'] == team]) / 5.0 if len(last_5_matches) == 5 else 0.5
        
        # Team Consistency (lower standard deviation of ranking = more consistent)
        team_consistency = max(5.0, 10.0 - hist_stats['rank'].std()) if len(hist_stats) > 1 else 8.0
        
        # Championship Momentum (exponential decay of championships won)
        championship_momentum = 0.0
        for yr, champ in self.champions.items():
            if champ == team and yr < before_year:
                # decay factor of 0.85 per year
                years_ago = before_year - yr
                championship_momentum += (0.85 ** years_ago)
                
        return {
            'win_pct': win_pct,
            'total_matches': total_matches,
            'total_wins': total_wins,
            'playoffs_pct': playoffs_pct,
            'finals_pct': finals_pct,
            'championships': championships,
            'last_season_rank': last_season_rank,
            'last_3_seasons_avg_rank': last_3_seasons_avg_rank,
            'last_5_seasons_avg_rank': last_5_seasons_avg_rank,
            'recent_win_pct': recent_win_pct,
            'batting_strength': bat_score,
            'bowling_strength': bowl_score,
            'all_rounder_score': all_rounder_score,
            'captaincy_score': captaincy_score,
            'stability_score': stability_score,
            'nrr_avg': nrr_avg,
            'home_win_pct': home_win_pct,
            'away_win_pct': away_win_pct,
            'chase_success_rate': chase_success_rate,
            'defend_success_rate': defend_success_rate,
            'form_index': form_index,
            'team_consistency': team_consistency,
            'championship_momentum': championship_momentum
        }
        
    def generate_ml_features(self):
        """
        Creates a training set where each row is a historical match, and the features represent the
        difference in team stats (Team A - Team B) at the start of that season.
        """
        print("Generating machine learning features from matches...")
        X = []
        y = []
        
        # We start from year 2011 to allow at least 3 years of history for averages
        train_matches = self.df_matches[self.df_matches['year'] >= 2011]
        
        for idx, row in train_matches.iterrows():
            t1 = row['team1']
            t2 = row['team2']
            year = row['year']
            winner = row['winner']
            
            # Skip if winner is not one of the teams (no result / tie)
            if winner not in [t1, t2] or pd.isna(winner):
                continue
                
            f1 = self.get_team_features_for_season(t1, year)
            f2 = self.get_team_features_for_season(t2, year)
            
            # Check home advantage
            is_home_t1 = get_is_home(t1, row['city'], row['venue'])
            is_home_t2 = get_is_home(t2, row['city'], row['venue'])
            
            # Create feature differences: Team1 - Team2
            features = {
                'diff_win_pct': f1['win_pct'] - f2['win_pct'],
                'diff_playoffs_pct': f1['playoffs_pct'] - f2['playoffs_pct'],
                'diff_finals_pct': f1['finals_pct'] - f2['finals_pct'],
                'diff_championships': f1['championships'] - f2['championships'],
                'diff_last_season_rank': f1['last_season_rank'] - f2['last_season_rank'],
                'diff_last_3_seasons_avg_rank': f1['last_3_seasons_avg_rank'] - f2['last_3_seasons_avg_rank'],
                'diff_last_5_seasons_avg_rank': f1['last_5_seasons_avg_rank'] - f2['last_5_seasons_avg_rank'],
                'diff_recent_win_pct': f1['recent_win_pct'] - f2['recent_win_pct'],
                'diff_batting_strength': f1['batting_strength'] - f2['batting_strength'],
                'diff_bowling_strength': f1['bowling_strength'] - f2['bowling_strength'],
                'diff_all_rounder_score': f1['all_rounder_score'] - f2['all_rounder_score'],
                'diff_captaincy_score': f1['captaincy_score'] - f2['captaincy_score'],
                'diff_stability_score': f1['stability_score'] - f2['stability_score'],
                'diff_nrr_avg': f1['nrr_avg'] - f2['nrr_avg'],
                'diff_home_win_pct': f1['home_win_pct'] - f2['home_win_pct'],
                'diff_away_win_pct': f1['away_win_pct'] - f2['away_win_pct'],
                'diff_chase_success_rate': f1['chase_success_rate'] - f2['chase_success_rate'],
                'diff_defend_success_rate': f1['defend_success_rate'] - f2['defend_success_rate'],
                'diff_form_index': f1['form_index'] - f2['form_index'],
                'diff_team_consistency': f1['team_consistency'] - f2['team_consistency'],
                'diff_championship_momentum': f1['championship_momentum'] - f2['championship_momentum'],
                'home_advantage': is_home_t1 - is_home_t2
            }
            
            X.append(features)
            # Target: 1 if Team 1 wins, 0 if Team 2 wins
            y.append(1 if winner == t1 else 0)
            
        return pd.DataFrame(X), np.array(y)
