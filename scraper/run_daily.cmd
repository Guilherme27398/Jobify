@echo off
rem Recolha diária de vagas (agendada no Agendador de Tarefas do Windows).
rem Corre o scraper a partir da raiz do repo e guarda o log em scraper\logs\daily.log.

cd /d "%~dp0\.."
if not exist "%~dp0logs" mkdir "%~dp0logs"

echo. >> "%~dp0logs\daily.log"
echo ===== %date% %time% ===== >> "%~dp0logs\daily.log"
"%~dp0.venv\Scripts\python.exe" -u -m scraper >> "%~dp0logs\daily.log" 2>&1
echo exit=%errorlevel% >> "%~dp0logs\daily.log"
