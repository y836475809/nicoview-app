@echo off
@REM make mp4 for local server
@REM drop ffmpeg.exe
echo %~dp0
cd /d %~dp0
set params="size=1280x720 -t 30 -vcodec h264 -pix_fmt yuv420p -movflags +faststart"
set params=%params:"=%
set dist=..\test\mock_server\data
%1 -f lavfi -i testsrc=%params% %dist%\play.mp4
%1 -f lavfi -i testsrc2=%params% %dist%\download.mp4
pause