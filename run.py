import subprocess
import os
import time

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")
    backend_dir = os.path.join(root_dir, "backend")

    print("Starting backend server (FastAPI)...")
    # Detect working python executable
    import sys
    venv_python = os.path.join(backend_dir, ".venv", "Scripts", "python.exe")
    if sys.executable and "python" in sys.executable.lower():
        python_cmd = [sys.executable]
    elif os.path.exists(venv_python):
        python_cmd = [venv_python]
    else:
        python_cmd = ["py", "-3.12"]

    # Start the backend server
    backend_process = subprocess.Popen(
        [*python_cmd, "-m", "uvicorn", "app.main:app", "--reload"],
        cwd=backend_dir
    )

    print("Starting frontend server (Vite)...")
    # Use npm.cmd on Windows, npm on Unix
    npm_cmd = "npm.cmd" if os.name == 'nt' else "npm"
    
    # Start the frontend server
    frontend_process = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir
    )

    try:
        # Keep the script running to keep both processes alive
        while True:
            time.sleep(1)
            # If either process dies, break the loop to clean up the other
            if backend_process.poll() is not None:
                print("Backend server stopped.")
                break
            if frontend_process.poll() is not None:
                print("Frontend server stopped.")
                break
    except KeyboardInterrupt:
        # Handle Ctrl+C gracefully
        print("\nReceived stop signal. Shutting down servers...")
    finally:
        # Terminate both processes
        backend_process.terminate()
        frontend_process.terminate()
        
        # Wait a moment for processes to shut down
        backend_process.wait()
        frontend_process.wait()
        
        print("Servers successfully stopped.")

if __name__ == "__main__":
    main()
