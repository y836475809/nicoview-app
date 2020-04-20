const { NicoVideoMocks } = window.NicoMock;

const video_mocks = [];
const video_ids = ["sm10", "sm20", "sm30", "sm40", "sm50"];
video_ids.forEach(video_id => {
    const video_mock = new NicoVideoMocks(video_id);
    video_mock.watch();
    video_mock.comment();
    video_mock.dmc_session();
    video_mock.dmc_hb();
    video_mocks.push(video_mock);
});