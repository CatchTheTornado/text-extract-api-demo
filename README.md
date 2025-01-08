# text-extract-api demo app

This tool uses [text-extract-api](https://github.com/CatchTheTornado/text-extract-api) to extract text from PDF files. 

Read how to <a href="https://github.com/CatchTheTornado/text-extract-api?tab=readme-ov-file#getting-started">Get started with the API and CLI</a>.

<strong>Warning: </strong> This is a demo version of the API and it may not be available at all times. The processing time may be longer than expected. Please DO NOT upload any sensitive, confidential or personal data. You are doing it at your own risk.

## Online access

This demo is available online: <a href="https://demo.doctractor.com/">https://demo.doctractor.com/</a>


## How to deploy it locally?

First, run the development server:

```bash
npm install
npm run dev
```

**Note:** On Apple Silicon please run these commands first (you will neeed [Homebrew](https://brew.sh/)): 

```bash
xcode-select --install
brew install pkg-config cairo pango libpng jpeg giflib librsvg
CPLUS_INCLUDE_PATH=/opt/homebrew/include npm install canvas
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

