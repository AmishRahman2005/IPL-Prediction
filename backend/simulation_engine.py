import numpy as np
import pandas as pd
import random
import math
import copy
from backend.data_pipeline import ACTIVE_TEAMS, HOME_CITIES, get_is_home  # pyrefly: ignore [missing-import]

# Generate the official IPL 10-team, 70-match schedule
def generate_ipl_schedule():
    # Group A
    g1 = ['Chennai Super Kings', 'Mumbai Indians', 'Royal Challengers Bengaluru', 'Kolkata Knight Riders', 'Rajasthan Royals']
    # Group B
    g2 = ['Delhi Capitals', 'Punjab Kings', 'Sunrisers Hyderabad', 'Lucknow Super Giants', 'Gujarat Titans']
    
    schedule = []
    
    # 1. Intra-group matches: each plays the other 4 teams in its group twice (1 home, 1 away)
    # Group 1
    for i in range(len(g1)):
        for j in range(i + 1, len(g1)):
            schedule.append({'team1': g1[i], 'team2': g1[j], 'home': g1[i]})
            schedule.append({'team1': g1[j], 'team2': g1[i], 'home': g1[j]})
    # Group 2
    for i in range(len(g2)):
        for j in range(i + 1, len(g2)):
            schedule.append({'team1': g2[i], 'team2': g2[j], 'home': g2[i]})
            schedule.append({'team1': g2[j], 'team2': g2[i], 'home': g2[j]})
            
    # 2. Inter-group matches: each team in Group 1 plays 4 teams in Group 2 once (2 home, 2 away)
    # And plays the remaining 1 "rival" team twice (1 home, 1 away)
    # Rivalry mapping:
    rivals = {
        'Chennai Super Kings': 'Delhi Capitals',
        'Mumbai Indians': 'Punjab Kings',
        'Royal Challengers Bengaluru': 'Sunrisers Hyderabad',
        'Kolkata Knight Riders': 'Lucknow Super Giants',
        'Rajasthan Royals': 'Gujarat Titans'
    }
    
    for t1 in g1:
        rival = rivals[t1]
        # Play rival twice (1 home, 1 away)
        schedule.append({'team1': t1, 'team2': rival, 'home': t1})
        schedule.append({'team1': rival, 'team2': t1, 'home': rival})
        
        # Play other 4 teams in Group 2 once
        # We alternate home advantage
        for idx, t2 in enumerate(g2):
            if t2 == rival:
                continue
            # Alternating home team based on alphabet/indices
            home_team = t1 if (g1.index(t1) + g2.index(t2)) % 2 == 0 else t2
            schedule.append({'team1': t1, 'team2': t2, 'home': home_team})
            
    return schedule

IPL_SCHEDULE = generate_ipl_schedule() # 70 matches

class IPLSimulationEngine:
    def __init__(self, data_pipeline, ml_system):
        self.data_pipeline = data_pipeline
        self.ml_system = ml_system
        self.active_teams = ACTIVE_TEAMS
        
    def run_monte_carlo(self, n_simulations=10000, strength_mult=1.0, form_weight=1.0, 
                        stability_weight=1.0, home_adv_weight=1.0):
        print(f"Starting Monte Carlo simulation ({n_simulations} seasons)...")
        
        # Find maximum year in the raw data
        max_year = int(self.data_pipeline.df_matches['year'].max())
        
        # Let's verify if there is a gap between max_year and 2027
        # We will simulate any intermediate years (e.g. 2025, 2026) to update team stats
        # but only aggregate and return results for 2027, 2028, 2029, 2030, 2031.
        simulation_years = list(range(max_year + 1, 2032))
        target_years = [2027, 2028, 2029, 2030, 2031]
        
        # Get Logistic Regression model coefficients for ultra-fast prediction
        # If Logistic Regression is not trained, we can fall back or use its coefficients
        log_reg = self.ml_system.models.get('Logistic Regression')
        if log_reg is None or not hasattr(log_reg, 'coef_'):
            # Fallback coefficients in case it's not fit
            feature_names = self.ml_system.feature_names
            coefs = np.zeros(len(feature_names))
            intercept = 0.0
        else:
            feature_names = self.ml_system.feature_names
            coefs = log_reg.coef_[0]
            intercept = log_reg.intercept_[0]
            
        coef_dict = dict(zip(feature_names, coefs))

        # Cache coefficients to local float variables to avoid massive dictionary lookup overhead
        coef_win_pct = coef_dict.get('diff_win_pct', 0.0)
        coef_playoffs_pct = coef_dict.get('diff_playoffs_pct', 0.0)
        coef_finals_pct = coef_dict.get('diff_finals_pct', 0.0)
        coef_championships = coef_dict.get('diff_championships', 0.0)
        coef_batting_strength = coef_dict.get('diff_batting_strength', 0.0)
        coef_bowling_strength = coef_dict.get('diff_bowling_strength', 0.0)
        coef_all_rounder_score = coef_dict.get('diff_all_rounder_score', 0.0)
        coef_captaincy_score = coef_dict.get('diff_captaincy_score', 0.0)
        
        coef_last_season_rank = coef_dict.get('diff_last_season_rank', 0.0)
        coef_last_3_seasons_avg_rank = coef_dict.get('diff_last_3_seasons_avg_rank', 0.0)
        coef_last_5_seasons_avg_rank = coef_dict.get('diff_last_5_seasons_avg_rank', 0.0)
        coef_recent_win_pct = coef_dict.get('diff_recent_win_pct', 0.0)
        coef_form_index = coef_dict.get('diff_form_index', 0.0)
        coef_championship_momentum = coef_dict.get('diff_championship_momentum', 0.0)
        
        coef_stability_score = coef_dict.get('diff_stability_score', 0.0)
        coef_team_consistency = coef_dict.get('diff_team_consistency', 0.0)
        
        coef_nrr_avg = coef_dict.get('diff_nrr_avg', 0.0)
        coef_home_win_pct = coef_dict.get('diff_home_win_pct', 0.0)
        coef_away_win_pct = coef_dict.get('diff_away_win_pct', 0.0)
        coef_chase_success_rate = coef_dict.get('diff_chase_success_rate', 0.0)
        coef_defend_success_rate = coef_dict.get('diff_defend_success_rate', 0.0)
        coef_home_advantage = coef_dict.get('home_advantage', 0.0)
        
        # Initialize storage for aggregations
        # For each target year and each team, track wins, points, champion wins, playoff qualifies, final appearances
        team_stats_by_year = {yr: {team: {
            'champion_count': 0,
            'playoff_count': 0,
            'final_count': 0,
            'total_wins': 0,
            'total_points': 0,
            'points_list': [],
            'wins_list': []
        } for team in self.active_teams} for yr in target_years}
        
        # We will run the simulation loop
        # To make it super fast, we'll keep a local cache of team stats at the start of each simulation run
        # and update them dynamically season-by-season.
        
        # Retrieve starting features for all teams (at the end of historical data)
        starting_features = {team: self.data_pipeline.get_team_features_for_season(team, max_year + 1) for team in self.active_teams}
        
        # Pre-calculate starting ranks once to avoid slow pandas queries inside the simulation loop
        starting_ranks = {}
        for team in self.active_teams:
            hist_ranks = self.data_pipeline.team_season_stats[self.data_pipeline.team_season_stats['team'] == team].sort_values(by='year', ascending=False)
            ranks_list = list(hist_ranks['rank'].values[:5])
            while len(ranks_list) < 5:
                ranks_list.append(5)
            starting_ranks[team] = ranks_list
            
        # Pre-assign home advantage city/venue checks
        # Let's map home values for all matchups
        matchup_home_vals = []
        for match in IPL_SCHEDULE:
            t1, t2, home = match['team1'], match['team2'], match['home']
            is_home_t1 = 1 if home == t1 else 0
            is_home_t2 = 1 if home == t2 else 0
            matchup_home_vals.append(is_home_t1 - is_home_t2)
            
        # Run simulations
        for sim in range(n_simulations):
            # In each simulation run, we start with the base features and copy them
            current_features = copy.deepcopy(starting_features)
            recent_ranks = copy.deepcopy(starting_ranks)
            
            # Run year-by-year simulation
            for yr in simulation_years:
                # 1. Simulate League Stage (70 matches)
                points = {team: 0 for team in self.active_teams}
                wins_count = {team: 0 for team in self.active_teams}
                nrr_scores = {team: 0.0 for team in self.active_teams}
                
                # Pre-calculate ratings contribution for each team (linear ratings decomposition)
                strength_rating = {}
                form_rating = {}
                stability_rating = {}
                nrr_rating = {}
                home_win_rating = {}
                away_win_rating = {}
                chase_rating = {}
                defend_rating = {}
                
                for team in self.active_teams:
                    tf = current_features[team]
                    strength_rating[team] = (
                        tf['win_pct'] * coef_win_pct +
                        tf['playoffs_pct'] * coef_playoffs_pct +
                        tf['finals_pct'] * coef_finals_pct +
                        tf['championships'] * coef_championships +
                        tf['batting_strength'] * coef_batting_strength +
                        tf['bowling_strength'] * coef_bowling_strength +
                        tf['all_rounder_score'] * coef_all_rounder_score +
                        tf['captaincy_score'] * coef_captaincy_score
                    )
                    form_rating[team] = (
                        tf['last_season_rank'] * coef_last_season_rank +
                        tf['last_3_seasons_avg_rank'] * coef_last_3_seasons_avg_rank +
                        tf['last_5_seasons_avg_rank'] * coef_last_5_seasons_avg_rank +
                        tf['recent_win_pct'] * coef_recent_win_pct +
                        tf['form_index'] * coef_form_index +
                        tf['championship_momentum'] * coef_championship_momentum
                    )
                    stability_rating[team] = (
                        tf['stability_score'] * coef_stability_score +
                        tf['team_consistency'] * coef_team_consistency
                    )
                    nrr_rating[team] = tf['nrr_avg'] * coef_nrr_avg
                    home_win_rating[team] = tf['home_win_pct'] * coef_home_win_pct
                    away_win_rating[team] = tf['away_win_pct'] * coef_away_win_pct
                    chase_rating[team] = tf['chase_success_rate'] * coef_chase_success_rate
                    defend_rating[team] = tf['defend_success_rate'] * coef_defend_success_rate
                
                # Inline matchup probability calculator
                def get_matchup_prob(t1, t2, is_home_val):
                    z = intercept
                    z += (strength_rating[t1] - strength_rating[t2]) * strength_mult
                    z += (form_rating[t1] - form_rating[t2]) * form_weight
                    z += (stability_rating[t1] - stability_rating[t2]) * stability_weight
                    z += (nrr_rating[t1] - nrr_rating[t2])
                    z += (home_win_rating[t1] - home_win_rating[t2])
                    z += (away_win_rating[t1] - away_win_rating[t2])
                    z += (chase_rating[t1] - chase_rating[t2])
                    z += (defend_rating[t1] - defend_rating[t2])
                    z += is_home_val * coef_home_advantage * home_adv_weight
                    return 1.0 / (1.0 + math.exp(-z))
                    
                # Simulate the 70 matches
                # Draw 70 random floats and 70 NRR changes at once for speed
                rands = np.random.rand(70)
                nrr_changes = np.random.normal(0.4, 0.15, size=70)
                for idx, match in enumerate(IPL_SCHEDULE):
                    t1, t2 = match['team1'], match['team2']
                    home_val = matchup_home_vals[idx]
                    
                    p = get_matchup_prob(t1, t2, home_val)
                    
                    if rands[idx] < p:
                        winner, loser = t1, t2
                    else:
                        winner, loser = t2, t1
                        
                    points[winner] += 2
                    wins_count[winner] += 1
                    
                    # NRR change
                    nrr_change = max(0.01, nrr_changes[idx])
                    nrr_scores[winner] += nrr_change
                    nrr_scores[loser] -= nrr_change
                    
                # Compute average NRR for the season
                for team in self.active_teams:
                    nrr_scores[team] /= 14.0
                    
                # 2. Determine Standings
                standings = sorted(self.active_teams, key=lambda t: (points[t], nrr_scores[t]), reverse=True)
                
                # Identify playoff teams (Top 4)
                playoff_teams = standings[:4]
                
                # 3. Simulate Playoffs
                t1_q1, t2_q1 = playoff_teams[0], playoff_teams[1]
                t1_elim, t2_elim = playoff_teams[2], playoff_teams[3]
                
                # Qualifier 1
                p_q1 = get_matchup_prob(t1_q1, t2_q1, 0)
                winner_q1, loser_q1 = (t1_q1, t2_q1) if random.random() < p_q1 else (t2_q1, t1_q1)
                
                # Eliminator
                p_elim = get_matchup_prob(t1_elim, t2_elim, 0)
                winner_elim, loser_elim = (t1_elim, t2_elim) if random.random() < p_elim else (t2_elim, t1_elim)
                
                # Qualifier 2
                p_q2 = get_matchup_prob(loser_q1, winner_elim, 0)
                winner_q2, loser_q2 = (loser_q1, winner_elim) if random.random() < p_q2 else (winner_elim, loser_q1)
                
                # Final
                p_final = get_matchup_prob(winner_q1, winner_q2, 0)
                champion, runner_up = (winner_q1, winner_q2) if random.random() < p_final else (winner_q2, winner_q1)
                
                # 4. Record stats if this is a target year
                if yr in target_years:
                    yr_stats = team_stats_by_year[yr]
                    for idx, team in enumerate(standings):
                        stats = yr_stats[team]

                        stats['total_wins'] += wins_count[team]
                        stats['total_points'] += points[team]
                        stats['points_list'].append(points[team])
                        stats['wins_list'].append(wins_count[team])
                        
                        if team in playoff_teams:
                            stats['playoff_count'] += 1
                        if team in [winner_q1, winner_q2]:
                            stats['final_count'] += 1
                        if team == champion:
                            stats['champion_count'] += 1
                            
                # 5. Update team features dynamically for the next season (momentum!)
                for team in self.active_teams:
                    rank = standings.index(team) + 1
                    recent_ranks[team].insert(0, rank)
                    if len(recent_ranks[team]) > 5:
                        recent_ranks[team].pop()
                        
                    # Update feature dictionary
                    tf = current_features[team]
                    
                    # Update historical games
                    tf['total_matches'] += 14
                    tf['total_wins'] += wins_count[team]
                    tf['win_pct'] = tf['total_wins'] / tf['total_matches']
                    
                    # Update rankings
                    tf['last_season_rank'] = rank
                    tf['last_3_seasons_avg_rank'] = sum(recent_ranks[team][:3]) / len(recent_ranks[team][:3])
                    tf['last_5_seasons_avg_rank'] = sum(recent_ranks[team]) / len(recent_ranks[team])
                    
                    # Update championships
                    if team == champion:
                        tf['championships'] += 1
                        
                    # Playoff / Final rates (approximated running percentages)
                    # We can decay or increment counts
                    total_seasons = len(recent_ranks[team])
                    tf['playoffs_pct'] = (tf['playoffs_pct'] * (total_seasons - 1) + (1 if team in playoff_teams else 0)) / total_seasons
                    tf['finals_pct'] = (tf['finals_pct'] * (total_seasons - 1) + (1 if team in [winner_q1, winner_q2] else 0)) / total_seasons
                    
                    # Recent win percentage
                    tf['recent_win_pct'] = (tf['recent_win_pct'] * 0.5) + ((wins_count[team] / 14.0) * 0.5)
                    
                    # Form index: last season performance
                    tf['form_index'] = wins_count[team] / 14.0
                    
                    # NRR avg
                    tf['nrr_avg'] = (tf['nrr_avg'] * 0.6) + (nrr_scores[team] * 0.4)
                    
                    # Championship momentum: decays previous score, adds if champion
                    tf['championship_momentum'] = (tf['championship_momentum'] * 0.85) + (1.0 if team == champion else 0.0)
                    
                    # Adjust quality scores dynamically (form bump!)
                    # If they win the championship, batting/bowling/stability/captaincy scores get a small boost!
                    # If they finish last, it decays slightly.
                    boost = 0.1 if team == champion else (-0.05 if rank == 10 else 0.0)
                    tf['batting_strength'] = min(10.0, max(5.0, tf['batting_strength'] + boost))
                    tf['bowling_strength'] = min(10.0, max(5.0, tf['bowling_strength'] + boost))
                    tf['captaincy_score'] = min(10.0, max(5.0, tf['captaincy_score'] + boost))
                    
        # 6. Process and compile results into return dictionary
        results = {}
        for yr in target_years:
            yr_stats = team_stats_by_year[yr]
            compiled_teams = []
            for team in self.active_teams:
                stats = yr_stats[team]
                
                champ_prob = stats['champion_count'] / n_simulations
                playoff_prob = stats['playoff_count'] / n_simulations
                final_prob = stats['final_count'] / n_simulations
                
                avg_points = stats['total_points'] / n_simulations
                avg_wins = stats['total_wins'] / n_simulations
                
                compiled_teams.append({
                    'team': team,
                    'win_probability': float(champ_prob),
                    'playoff_probability': float(playoff_prob),
                    'final_probability': float(final_prob),
                    'expected_points': float(avg_points),
                    'expected_wins': float(avg_wins),
                    'points_history': stats['points_list'][:100], # Keep a sample of points for distribution plots
                })
                
            # Sort by win probability
            compiled_teams = sorted(compiled_teams, key=lambda t: t['win_probability'], reverse=True)
            
            # Predict top 4 teams (sorted by playoff probability)
            top_4_teams = sorted(compiled_teams, key=lambda t: t['playoff_probability'], reverse=True)[:4]
            top_4_names = [t['team'] for t in top_4_teams]
            
            # Champion prediction
            champion_pred = compiled_teams[0]
            
            # Confidence score calculation: base it on the gap between 1st and 2nd probability,
            # and the magnitude of the champion's win probability
            prob_gap = compiled_teams[0]['win_probability'] - compiled_teams[1]['win_probability']
            confidence = min(99.0, max(50.0, 50.0 + (compiled_teams[0]['win_probability'] * 100.0) + (prob_gap * 100.0)))
            
            results[yr] = {
                'champion': champion_pred['team'],
                'champion_probability': champion_pred['win_probability'],
                'confidence_score': float(confidence),
                'top_4': top_4_names,
                'teams_probs': compiled_teams
            }
            
        print("Simulation complete.")
        return results
