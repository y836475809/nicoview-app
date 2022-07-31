@echo off
@REM make cert for local server
@REM drop mkcert.exe
echo %~dp0
cd /d %~dp0
cd ..\test\mock_server\cert
%1 -install
pause
%1 -CAROOT
pause
%1 -key-file key.pem -cert-file cert.pem api.dmc.nico api.search.nicovideo.jp nicovideo.cdn.nimg.jp nmsg.nicovideo.jp pa0000.dmc.nico www.nicovideo.jp
pause