use async_std::net::TcpListener;
use async_std::task;
use async_tungstenite::accept_async;
use async_tungstenite::tungstenite::protocol::Message;
use futures::prelude::*;

async fn handle_connection(stream: async_std::net::TcpStream) {
    let ws_stream = accept_async(stream)
        .await
        .expect("Error during the websocket handshake occurred");
    let (mut write, mut read) = ws_stream.split();

    while let Some(msg) = read.next().await {
        let msg = msg.expect("Failed to read message");

        match msg {
            Message::Text(text) => {
                println!("Received message: {}", text);
                // Add robot control logic here
                if text == "forward" {
                    // Robot forward code
                } else if text == "backward" {
                    // Robot backward code
                } else if text == "left" {
                    // Robot left turn code
                } else if text == "right" {
                    // Robot right turn code
                } else if text == "stop" {
                    // Robot stop code
                }
            }
            _ => {}
        }
    }
}

fn main() {
    task::block_on(async {
        let addr = "0.0.0.0:9001";
        let listener = TcpListener::bind(&addr).await.expect("Failed to bind");

        println!("Listening on: {}", addr);

        while let Ok((stream, _)) = listener.accept().await {
            task::spawn(handle_connection(stream));
        }
    });
}
