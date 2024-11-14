"use client"

import { Button } from "@/components/ui/button"
import { use, useEffect, useState } from "react"
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './pdf-extract-ui.module.css'
import { convert } from '@/lib/pdf2js'
import { pdfjs  } from "react-pdf"
import ZoomableImage from "./zoomable-image"
import { createWorker, OEM, PSM } from 'tesseract.js';
import { SyncRedactor  } from '@/lib/redactor';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { CallWarning, convertToCoreMessages, FinishReason, streamText } from 'ai';
import { ApiClient, OcrRequest } from 'pdf-extract-api-client';
import { CopyrightIcon, GithubIcon, SendIcon, StarIcon } from "lucide-react"

const redactor = new SyncRedactor();

export type ImageData = {
  base64Content: string;
  displayName: string;
};


export function PdfExtractUi() {
  
  const [prompt, setPrompt] = useState<string>("Fix typos, remove Personal Data (addresses, name, last name, phone number), convert to JSON and return only JSON structure");
  const  [documentText, setDocumentText] = useState<string>("");
  const [images, setImages] = useState<ImageData[]>([]);
  const [status, setStatus] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const apiClient = new ApiClient('https://api.doctractor.com/', 'doctractor', 'Aekie2ao');

  const checkResult = async (taskId: string) => {
    let isDone = false;
    while (!isDone) {
      const response = await apiClient.getResult(taskId);
      console.log(response);
      if (response.state === 'PROGRESS' || response.state === 'PENDING') {
          setStatus(response.status + (response.info && response.info.elapsed_time ? ` (${response.info.elapsed_time.toFixed(2)}s)` : ''));
        await new Promise(resolve => setTimeout(resolve, 2000)); // wait for 2 seconds before checking again
      } else {
        if (response.state === 'SUCCESS') {
          setDocumentText(response.result);
          setStatus('');
        } 
        isDone = true;
        localStorage.removeItem('taskId');
      }
    };
  }

  useEffect(() => {
    if (localStorage.getItem('taskId')) {
      checkResult(localStorage.getItem('taskId') as string);
    }
  });  

  const executeRequest = async (file:File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('prompt', prompt);
    formData.append('strategy', 'marker');
    formData.append('model', 'llama3.1')
    formData.append('ocr_cache', 'true');
    apiClient.uploadFile(formData).then(response => {
      console.log(response);
      const taskId = response.task_id;
      localStorage.setItem('taskId', taskId as string);
      checkResult(response.task_id as string);
    }).catch(error => {
      console.error(error);
      setStatus(error.message);
    });

  }

  const processFile = async (file: File, base64Content: string) => {

    setDocumentText('');

    (async () => {
      let imagesArray: ImageData[] = []
      if(file.type === "application/pdf") {
        const pagesArray = await convert(base64Content,{ base64: true }, pdfjs);
        let page = 1;
        for(const image of pagesArray) {
          imagesArray.push({
            displayName: file.name + '-' + page,
            base64Content: image
          })
          page ++;
        }
        setImages(imagesArray);
      } else {
        setStatus("Unsupported file type. Please upload an image or a PDF file.");
        return;
      }
      
      setUploadedFile(file);
//        setDocumentText(textBuffer);
    })();    

  }



  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentText('Processing files ...');
    const file = event.target.files?.[0];
    if (file) {     
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const base64Content = event.target.result.toString();
          processFile(file, base64Content);
        };
      }
      reader.readAsDataURL(file);

      // Process the selected file here
      console.log("Selected file:", file);
    }
  };  

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">PDF Extract API Demo</h1>
      </header>
      <main className="flex-1 bg-background text-foreground p-8 overflow-auto text-sm">
        <div className="prose max-w-3xl mx-auto">
          <div>
          This is a demo of the <a href="https://github.com/CatchTheTornado/pdf-extract-api" className="font-bold">PDF Extract API</a>. Upload a PDF file and enter the prompt to extract or transform the content exactly as you want. For example transforming it to JSON structure or to Markdown format.
          </div>
          <div className="mt-3">
            If you need <strong>pdf-extract-api</strong> for commercial purposes with guaranteed processing and storage resources plsease <a href="mailto:info@catchthetornado.com?subject=Commercial%20Extract%20API%20from%20demo" className="font-bold">contact us</a>
          </div>
          <div className="mt-3">
            <strong>Warning: </strong> This is a demo version of the API and it may not be available at all times. The processing time may be longer than expected. Please DO NOT upload any sensitive, confidential or personal data. You are doing it at your own risk.
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="bg-zinc-950 text-white text-sm px-4 py-2 rounded-md mt-5">
                Select PDF file...
              </div>
              <input
              id="image-upload"
              type="file"
              accept="image/*;application/pdf"
              className="sr-only bg-orange"
              onChange={handleFileUpload}
              />
            </label>
            </div>          
           <div className="flex-wrap flex items-center justify-left min-h-100">
                {images
                  .map((image, index) => (
                    <ZoomableImage
                      className='w-100 p-2 bg-white'
                      width={100}
                      height={100}
                      key={`${index}`}
                      src={image.base64Content}
                      alt={image.displayName}
                    />
                  ))}            
              </div>    
              {documentText ? (                
                <Markdown className={styles.markdown + ' border border-dashed border-green-200 p-5'} remarkPlugins={[remarkGfm]}>
                  {documentText}
                </Markdown>   
              ): ''}
          <div className="mt-4">
            <div className="flex items-center gap-4">
              Enter the prompt to transform the PDF file:
            </div>
            <div className="flex items-center gap-4">
              <textarea className="w-full h-32 p-2 bg-white border-black border-dashed border" placeholder="Enter a prompt to transform uploaded PDF - for example: Conert and return only JSON" value={prompt} onChange={(e) => setPrompt(e.target.value) }  />
            </div>

          </div>
          <div className="mt-4">
            <Button className="bg-primary text-primary-foreground" onClick={() => { if(uploadedFile) { executeRequest(uploadedFile) } else { setStatus('Select PDF file first') } }}><SendIcon className="w-4 h-4 mr-4" /> Transform!</Button>
          </div>
          {(status ? (
              <div className="flex items-center gap-4 border border-dashed border-orange p-4 mt-5">
                Status: {status}
              </div>
            ): '')}
        <div className="mt-4">
          <h3 className="text-lg">Next steps</h3>
            <ul className="list-disc list-inside pl-4">
                <li>Check the <a href="https://github.com/CatchTheTornado/pdf-extract-api?tab=readme-ov-file#getting-started" className="underline text-blue-600">Getting started guide</a></li>
                <li>Read the <a href="https://github.com/CatchTheTornado/pdf-extract-api?tab=readme-ov-file#endpoints" className="underline text-blue-600">API and CLI docs</a></li>
                <li>Get the Typescript <a href="https://www.npmjs.com/package/pdf-extract-api-client" className="underline text-blue-600">API client</a></li>
                <li><a className="underline text-blue-600" href="mailto:info@catchthetornado.com?subject=Commercial%20Extract%20API%20from%20demo">Contact us</a> if you require a hosted commercial version, GDPR safe, SLA etc.</li>
                <li>Check the <a className="underline text-blue-600" href="https://github.com/CatchTheTornado/pdf-extract-api-demo">source code of this demo</a></li>
            </ul>
        </div>

        </div>

      </main>
      <footer className="bg-muted text-muted-foreground py-4 px-6 flex justify-between items-center gap-4 text-sm">
        <div className="flex justify-between w-full">
          <div className="flex items-center gap-2">
            <CopyrightIcon /> 2024 CatchTheTornado
          </div>
          <div className="flex items-center gap-2">
            <a href="https://github.com/CatchTheTornado/pdf-extract-api" className="flex items-center gap-2">
              <GithubIcon className="w-4 h-4" /> Github
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
