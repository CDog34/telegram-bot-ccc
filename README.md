# Telegram bot backend: CDog's Content Collector (ccc for short)

## Feature
+ Download `photo`, `document(mime type:image/*)` and `images in Tweet`, which were sent to the bot, to local file.
+ Use puppeteer to crawl images from twitter.

## Environment variables 
+ BOT_KEY: Your telegram bot key.
+ MY_ID: Your telegram user id. The bot only serve yourself.
+ POLLING_TIMEOUT: Telegram update long polling time out.
+ API_RETRY_LIMIT: Maximum api retry times. You know, the connectivity of telegram api may not be very stable in some region.
+ FILE_STORAGE: Local file storage path.

## About
This project is just in the early version. 
It comes to me, when I realized that I need a program to download the images from other telegram channels automatically.

Currently, I'm using it inside a docker container, with a `bind volume`, which is mounted from my `Synology DS718+` via `NFS`.
With the `Cloud Station` app on the `DS718+`, I can upload these images to `OneDrive` automatically.

If you have any idea, feel free to start an `issue` or `pull request`.

## TODO
+ Support downloading images from pixiv.
