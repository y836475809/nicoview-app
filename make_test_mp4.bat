ffmpeg -f lavfi -i testsrc=size=1280x720 -t 30 -vcodec h264 -pix_fmt yuv420p -movflags +faststart .\test\mock_server\data\play.mp4
ffmpeg -f lavfi -i testsrc2=size=1280x720 -t 30 -vcodec h264 -pix_fmt yuv420p -movflags +faststart .\test\mock_server\data\download.mp4
pause