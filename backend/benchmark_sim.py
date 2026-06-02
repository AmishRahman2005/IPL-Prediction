import time
from backend.data_pipeline import IPLDataPipeline
from backend.ml_system import IPLMLSystem
from backend.simulation_engine import IPLSimulationEngine

def main():
    print("Initializing benchmark pipeline...")
    # Initialize components
    data_pipeline = IPLDataPipeline(filepath="IPL.csv")
    data_pipeline.load_and_clean_data()
    X, y = data_pipeline.generate_ml_features()
    
    ml_system = IPLMLSystem()
    ml_system.train_and_evaluate(X, y)
    
    sim_engine = IPLSimulationEngine(data_pipeline, ml_system)
    
    # Run 10,000 simulations
    print("Running 10,000 Monte Carlo seasons...")
    start = time.time()
    sim_engine.run_monte_carlo(n_simulations=10000)
    end = time.time()
    
    duration = end - start
    print(f"\nBenchmark results:")
    print(f"Simulations: 10,000 seasons")
    print(f"Total time elapsed: {duration:.3f} seconds")
    print(f"Average time per season: {(duration / 10000) * 1000:.3f} ms")

if __name__ == "__main__":
    main()
