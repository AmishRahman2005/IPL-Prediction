import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold, cross_validate  # pyrefly: ignore [missing-import]
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier  # pyrefly: ignore [missing-import]
from sklearn.linear_model import LogisticRegression  # pyrefly: ignore [missing-import]
import xgboost as xgb  # pyrefly: ignore [missing-import]
import lightgbm as lgb  # pyrefly: ignore [missing-import]
from sklearn.metrics import accuracy_score, roc_auc_score  # pyrefly: ignore [missing-import]

import pickle
import os

class IPLMLSystem:
    def __init__(self):
        self.models = {
            'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
            'Random Forest': RandomForestClassifier(n_estimators=40, max_depth=6, random_state=42),
            'XGBoost': xgb.XGBClassifier(n_estimators=40, max_depth=4, random_state=42, eval_metric='logloss'),
            'LightGBM': lgb.LGBMClassifier(n_estimators=40, max_depth=4, random_state=42, verbose=-1)
        }
        self.best_model_name = None
        self.best_model = None
        self.best_accuracy = 0.0
        self.feature_importances = {}
        self.model_metrics = {}
        self.feature_names = []
        
    def train_and_evaluate(self, X, y):
        self.feature_names = list(X.columns)
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        
        self.model_metrics = {}
        best_acc = 0.0
        best_name = None
        
        for name, clf in self.models.items():
            print(f"Training and cross-validating {name}...")
            # Perform cross validation
            cv_results = cross_validate(clf, X, y, cv=cv, scoring=['accuracy', 'roc_auc'], return_estimator=True)
            acc = cv_results['test_accuracy'].mean()
            auc = cv_results['test_roc_auc'].mean()
            
            # Retrain on full data
            clf.fit(X, y)
            
            self.model_metrics[name] = {
                'accuracy': float(acc),
                'auc': float(auc)
            }
            
            if acc > best_acc:
                best_acc = acc
                best_name = name
                self.best_model = clf
                
        self.best_model_name = best_name
        self.best_accuracy = best_acc
        print(f"Best model: {self.best_model_name} with CV accuracy: {self.best_accuracy:.4f}")
        
        # Calculate feature importances for the best model
        self.calculate_feature_importances()
        
    def calculate_feature_importances(self):
        if self.best_model is None:
            return
            
        importances = []
        if hasattr(self.best_model, 'feature_importances_'):
            importances = self.best_model.feature_importances_
        elif hasattr(self.best_model, 'coef_'):
            # For Logistic Regression, use absolute coefficients as importance
            importances = np.abs(self.best_model.coef_[0])
            # Normalize to sum to 1
            if importances.sum() > 0:
                importances = importances / importances.sum()
                
        self.feature_importances = {}
        for name, imp in zip(self.feature_names, importances):
            # Clean up diff_ prefix for display
            clean_name = name.replace('diff_', '').replace('_', ' ').title()
            self.feature_importances[clean_name] = float(imp)
            
        # Sort feature importances
        self.feature_importances = dict(sorted(self.feature_importances.items(), key=lambda item: item[1], reverse=True))

    def predict_probability(self, team1_features, team2_features, home_adv_val=0, 
                            strength_mult=1.0, form_weight=1.0, stability_weight=1.0, home_adv_weight=1.0):
        """
        Predicts win probability of Team 1 beating Team 2.
        Applies user weights and multipliers to the computed features.
        """
        diffs = {
            'diff_win_pct': (team1_features['win_pct'] - team2_features['win_pct']) * strength_mult,
            'diff_playoffs_pct': (team1_features['playoffs_pct'] - team2_features['playoffs_pct']) * strength_mult,
            'diff_finals_pct': (team1_features['finals_pct'] - team2_features['finals_pct']) * strength_mult,
            'diff_championships': (team1_features['championships'] - team2_features['championships']) * strength_mult,
            
            'diff_last_season_rank': (team1_features['last_season_rank'] - team2_features['last_season_rank']) * form_weight,
            'diff_last_3_seasons_avg_rank': (team1_features['last_3_seasons_avg_rank'] - team2_features['last_3_seasons_avg_rank']) * form_weight,
            'diff_last_5_seasons_avg_rank': (team1_features['last_5_seasons_avg_rank'] - team2_features['last_5_seasons_avg_rank']) * form_weight,
            'diff_recent_win_pct': (team1_features['recent_win_pct'] - team2_features['recent_win_pct']) * form_weight,
            'diff_form_index': (team1_features['form_index'] - team2_features['form_index']) * form_weight,
            'diff_championship_momentum': (team1_features['championship_momentum'] - team2_features['championship_momentum']) * form_weight,
            
            'diff_batting_strength': (team1_features['batting_strength'] - team2_features['batting_strength']) * strength_mult,
            'diff_bowling_strength': (team1_features['bowling_strength'] - team2_features['bowling_strength']) * strength_mult,
            'diff_all_rounder_score': (team1_features['all_rounder_score'] - team2_features['all_rounder_score']) * strength_mult,
            'diff_captaincy_score': (team1_features['captaincy_score'] - team2_features['captaincy_score']) * strength_mult,
            
            'diff_stability_score': (team1_features['stability_score'] - team2_features['stability_score']) * stability_weight,
            'diff_team_consistency': (team1_features['team_consistency'] - team2_features['team_consistency']) * stability_weight,
            
            'diff_nrr_avg': (team1_features['nrr_avg'] - team2_features['nrr_avg']),
            'diff_home_win_pct': (team1_features['home_win_pct'] - team2_features['home_win_pct']),
            'diff_away_win_pct': (team1_features['away_win_pct'] - team2_features['away_win_pct']),
            'diff_chase_success_rate': (team1_features['chase_success_rate'] - team2_features['chase_success_rate']),
            'diff_defend_success_rate': (team1_features['defend_success_rate'] - team2_features['defend_success_rate']),
            
            'home_advantage': home_adv_val * home_adv_weight
        }
        
        # Build features in the exact training order
        features_ordered = [diffs[col] for col in self.feature_names]
        df_pred = pd.DataFrame([features_ordered], columns=self.feature_names)
        
        # Predict probability
        prob = self.best_model.predict_proba(df_pred)[0][1] # Probability of 1 (Team 1 wins)
        return prob
        
    def save_model(self, path="model.pkl"):
        state = {
            'best_model_name': self.best_model_name,
            'best_model': self.best_model,
            'best_accuracy': self.best_accuracy,
            'feature_importances': self.feature_importances,
            'model_metrics': self.model_metrics,
            'feature_names': self.feature_names
        }
        with open(path, 'wb') as f:
            pickle.dump(state, f)
            
    def load_model(self, path="model.pkl"):
        if not os.path.exists(path):
            return False
        with open(path, 'rb') as f:
            state = pickle.load(f)
        self.best_model_name = state['best_model_name']
        self.best_model = state['best_model']
        self.best_accuracy = state['best_accuracy']
        self.feature_importances = state['feature_importances']
        self.model_metrics = state['model_metrics']
        self.feature_names = state['feature_names']
        return True
