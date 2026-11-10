Set WshShell = CreateObject("WScript.Shell")
' Check if port 5000 is open; if not, launch python app.py silently
WshShell.Run "powershell.exe -NoProfile -WindowStyle Hidden -Command ""if (-not (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue)) { Start-Process 'python' -ArgumentList 'app.py' -WorkingDirectory 'c:\Users\HP\Desktop\ELECHUB' -WindowStyle Hidden }""", 0, True

' Small delay to allow server to be ready
WScript.Sleep 1200

' Launch borderless standalone app window
WshShell.Run """C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"" --app=""http://localhost:5000""", 1, False
