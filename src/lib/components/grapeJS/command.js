import { getHTMLandCSS } from '../../html-to-gif/create-media.js';
import { createImagePublic, createGifPublic } from '../../../api/image.js';
import { getTemplate } from '../../../api/template.js';


const createImage = async (editor, Modal) => {
    const htmlCode = editor.getHtml();
    const cssCode = editor.getCss();
    const html = await getHTMLandCSS(htmlCode, cssCode);
    const width = editor.Canvas.getWindow().innerWidth;
    const height = editor.Canvas.getWindow().innerHeight;
    const { image } = await createImagePublic({
        html,
        width,
        height,
    });

    //Set content of modal
    const { template } = await getTemplate({
        type: 'IMAGE_GENERATED',
        variables: {
            imageURL: image.url,
        }
    });
    Modal.setContent(`
      ${template}
    `);
}


const createGif = async (editor, Modal) => {
    const htmlCode = editor.getHtml();
    const cssCode = editor.getCss();
    const html = await getHTMLandCSS(htmlCode, cssCode);
    const width = editor.Canvas.getWindow().innerWidth;
    const height = editor.Canvas.getWindow().innerHeight;
    const { gif } = await createGifPublic({
        html,
        width,
        height,
    });

    //Set content of modal
    const { template } = await getTemplate({
        type: 'GIF_GENERATED',
        variables: {
            gifURL: gif.url,
        }
    });
    Modal.setContent(`
      ${template}
    `);
}
const initCommands = (editor) => {
    const commandManager = editor.Commands;
    commandManager.add('create-image', {
        run(editor) {
            const { Modal } = editor;
            Modal.open({
                title: 'Create Image',
                content: `
                <div role="status" class="w-full text-center">
  <div class="flex w-full justify-center">
    <svg aria-hidden="true" class="mr-2 inline h-8 w-8 animate-spin fill-gray-600 text-gray-200 dark:fill-gray-300 dark:text-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
        fill="currentColor
                        "
      />
      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
    </svg>
    <span class="sr-only">Loading...</span>
  </div>
  <br />
  <div class="fade-in-out-text"></div>
</div>
<style>
    @keyframes cycleText {
       0%, 33% {
          content: "Creating Image";
      }
      34%, 66% {
          content: "Capturing Page";
      }
      67%, 100% {
          content: "Uploading File";
      }
  }

  .fade-in-out-text::before {
      content: "Creating Gif";
      display: inline-block;
      animation: cycleText 10s infinite; /* Adjust the duration as needed */
  }
                `,

            });

            Modal.onceClose(() => {
                isOpen = false;
            });

            let isOpen = Modal.isOpen();
            if (isOpen) {
                createImage(editor, Modal);
            }
        }
    });

    commandManager.add('create-gif', {
        run(editor) {
            const { Modal } = editor;
            Modal.open({
                title: 'Create GIF',
                content: `
                <div role="status" class="w-full text-center">
                <div class="flex w-full justify-center">
                  <svg aria-hidden="true" class="mr-2 inline h-8 w-8 animate-spin fill-gray-600 text-gray-200 dark:fill-gray-300 dark:text-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor
                                      "
                    />
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                  </svg>
                  <span class="sr-only">Loading...</span>
                </div>
                <br />
                <div class="fade-in-out-text"></div>
              </div>
              <style>
                  @keyframes cycleText {
                     0%, 25% {
                        content: "Creating Gif";
                    }
                    26%, 50% {
                        content: "Running Animation";
                    }
                    51%, 75% {
                        content: "Uploading File";
                    }
                     76%, 100% {
                        content: "Gifs take longer to generate than image";
                    }
                }

                .fade-in-out-text::before {
                    content: "Creating Gif";
                    display: inline-block;
                    animation: cycleText 20s infinite; /* Adjust the duration as needed */
                }
              </style>
                `,
            });

            Modal.onceClose(() => {
                isOpen = false;
            });

            let isOpen = Modal.isOpen();
            if (isOpen) {
                createGif(editor, Modal);
            }
        }
    });

};

export default initCommands;