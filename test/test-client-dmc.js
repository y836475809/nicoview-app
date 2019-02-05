const request = require("request");
const { JSDOM } = require("jsdom");
const fs = require("fs");

let jar = request.jar();

const get_options = {
    url: "https://www.nicovideo.jp/watch/sm33835622",
    method: "GET",
    jar:jar
};

request(get_options, (error, response, body) => {
    const dom = new JSDOM(body).window.document;
    const data = JSON.parse(
        dom.querySelector("#js-initial-watch-data").getAttribute("data-api-data")
    );

    const session_api = data.video.dmcInfo.session_api;
    const url = session_api.urls[0].url;
    const req_json = {
        session: {
            recipe_id: session_api.recipe_id,
            content_id: session_api.content_id,
            content_type: "movie",
            content_src_id_sets: [
                {
                    content_src_ids: [
                        {
                            src_id_to_mux: {
                                video_src_ids: session_api.videos,
                                audio_src_ids: session_api.audios
                            }
                        }
                    ]
                }
            ],
            timing_constraint: "unlimited",
            keep_method: {
                heartbeat: {
                    lifetime: 120000
                }
            },
            protocol: {
                name: "http",
                parameters: {
                    http_parameters: {
                        parameters: {
                            http_output_download_parameters: {
                                use_well_known_port: "yes",
                                use_ssl: "yes",
                                transfer_preset: ""
                            }
                        }
                    }
                }
            },
            content_uri: "",
            session_operation_auth: {
                session_operation_auth_by_signature: {
                    token: session_api.token,
                    signature: session_api.signature
                }
            },
            content_auth: {
                auth_type: "ht2",
                content_key_timeout: session_api.content_key_timeout,
                service_id: "nicovideo",
                service_user_id: session_api.service_user_id
            },
            client_info: {
                player_id: session_api.player_id
            },
            priority: session_api.priority
        }
    };

    // fs.writeFileSync("test.json", JSON.stringify(data, null, "  "));
    // fs.writeFileSync("req_test.json", JSON.stringify(req_json, null, "  "));

    const headers = {
        "content-type": "application/json"
    };
    const post_options = {
        url: `${url}?_format=json`,
        method: "POST",
        jar:jar,
        headers: headers,
        json: req_json
    };
    request(post_options, (error, response, body) => {
        if (error) {
            console.error("post error: ", error);
        }
        else {
            // console.log(response);
            console.log("post: ", body);
            fs.writeFileSync("res_test.json", JSON.stringify(body, null, "\t"));
        }
    });
});