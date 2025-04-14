"""Run QED-C benchmarks."""
# Native imports:
import argparse
import ast
import os
import subprocess
from datetime import datetime

# Third-party imports:
from git import Repo

# Module imports:
from metadata import (
    benchmarks, 
    metriq_task_name_map, 
    metriq_method_name_map, 
    metriq_platform_name_map,
    qedc_submission_id,
)

# Client for Metriq webapp:
from metriq import MetriqClient
from metriq.models.result import ResultCreateRequest


def run_benchmarks(client: MetriqClient):
    """Run suite of benchmarks from benchmark metadata."""
    # Process each benchmark:
    for i, benchmark in enumerate(benchmarks):
        algorithm = benchmarks[benchmark]["algorithm"]
        min_qubits = benchmarks[benchmark]["min_qubits"]
        max_qubits = benchmarks[benchmark]["max_qubits"]
        num_shots = benchmarks[benchmark]["num_shots"]
        print(f"Running benchmark {i+1} out of {len(benchmarks)} for {algorithm} with min qubits: {min_qubits}, max_qubits: {max_qubits}, and num_shots: {num_shots}.")

        providers = benchmarks[benchmark]["providers"]
        for provider in providers:
            for environment, device in provider.items():
                benchmark_script = [f for f in os.listdir(os.path.join(algorithm, environment)) if f.endswith('_benchmark.py')][0]

                # Run each benchmark script with command line args:
                result = subprocess.run(
                    ["python", 
                    f"{os.path.join(algorithm, environment, benchmark_script)}", 
                    "-backend_id", f"{device}",
                    "-min_qubits", f"{min_qubits}",
                    "-max_qubits", f"{max_qubits}",
                    "-num_shots", f"{num_shots}",
                    ],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE
                )
                try:
                    # Data obtained is a string, so interpret as dictionary and store in benchmarking dictionary.
                    data = ast.literal_eval(result.stdout.decode("utf8").split("\n")[-2])
                    print(data)
                    data["algorithm"] = algorithm
                    data["device"] = device
                    process_data_for_metriq(data, client)
                except:
                    print(f"No data for {algorithm} running on {device}")


def process_data_for_metriq(data: dict, client: MetriqClient):
    """Process data obtained from QED-C benchmark script."""
    task_id = metriq_task_name_map.get(data["algorithm"])["task_id"]
    platform_id = metriq_platform_name_map.get(data["device"])["platform_id"]
    method_id = metriq_method_name_map.get(data["device"])["method_id"]

    for i, qubit in enumerate(data["groups"]):
        result = ResultCreateRequest()
        result.task = task_id
        result.method = method_id
        result.platform = platform_id
        result.metricName = "Fidelity"
        result.metricValue = data["avg_fidelities"][i]
        result.evaluatedAt = datetime.today().strftime("%Y-%m-%d")
        result.isHigherBetter = "true"
        result.qubitCount = qubit
        result.circuitDepth = int(data["avg_depths"][i])
        result.notes = "Obtained automatically via QED-C benchmark script."

        print(result)

        try:
            # Upload benchmark result to Metriq:
            print(f"Uploading: {result}")
            client.result_add(result=result, submission_id=qedc_submission_id)
        except:
            # Unable to upload benchmark data to Metriq:
            print("Unable to upload...")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run benchmarking.")
    parser.add_argument("-token", help="Bearer token for Metriq API.", type=str)

    # Specify path of QED-C repo and where to check it out:
    project_name = "benchmark"
    repo_name = "QC-App-Oriented-Benchmarks"
    git_url = "https://github.com/unitaryfoundation/QC-App-Oriented-Benchmarks"
    repo_dir = os.path.join(project_name, repo_name)

    # If QED-C repo does not exist locally, clone it:
    if os.path.exists(repo_dir):
        print(f"QED-C benchmarks repository present in {repo_dir}")
    else:
        print(f"Cloning {git_url} into {repo_dir}...")
        Repo.clone_from(git_url, repo_dir)
        print("Clone complete")

    # To run this locally, we'll need to change directories:
    dir_path = os.path.dirname(os.path.realpath(__file__))
    os.chdir(os.path.join(dir_path, project_name, repo_name))

    args = parser.parse_args()
    token = args.token
    client = MetriqClient(url="https://metriq.info", token=token)

    run_benchmarks(client)

