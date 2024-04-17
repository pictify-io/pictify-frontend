<script>
import { onMount } from 'svelte';
import CodeMirror from 'svelte-codemirror-editor';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';

let codeHTML ="<html><body><h1>Hello World</h1></body></html>";
let codeCSS = "h1{color:red;}";

let maxWidth = "40vw";
let currentTab = 'html';
let currentResultTab = 'preview';
let previewFrame ;
let iframeContainer;

  onMount(async () => {

    if(window.innerWidth < 768){
      maxWidth = "90vw";
    }
    updateIframe(); 
  });

  function returnStyleTag(css) {
    const styleTagRegex = /<style>(.*?)<\/style>/s;
    const match = styleTagRegex.exec(css);
    if (match) {
      return css;
    } else {
      return css.replace('[styleOpen]', '<$>').replace('[styleClose]', '</$>').replaceAll('$', 'style');
    }
  }

  function getSrcDoc() {
    return `
        <head>
          ${returnStyleTag(`[styleOpen]${codeCSS}[styleClose]`)}
        </head>
          ${codeHTML}
`;
  }

  function updateIframe() {
    if (previewFrame) {
      previewFrame.srcdoc = getSrcDoc();
    }
  }

  function updateScale(value) {
    iframeContainer.style.transform = `scale(${value})`;
    iframeContainer.style.transformOrigin = 'top left';
  }
</script>

<section>
  <div class="flex flex-col md:flex-row border-black border-4 w-[80vw] md:min-h-[400px] xl:min-h-[500px]">
    <div class="flex-1">
      <div class="flex bg-black p-2">
        <button on:click={() => currentTab = 'html'} class="px-4 py-2 rounded text-sm {currentTab === 'html' ? 'bg-white text-black': 'bg-gray-500 text-white'}">HTML</button>
        <button on:click={() => currentTab = 'css'} class="mx-4 px-4 py-2 rounded text-sm {currentTab === 'css' ? 'bg-white text-black': 'bg-gray-500 text-white'}">CSS</button>
      </div>
    {#if currentTab === 'html'}
    <CodeMirror
    bind:codeHTML
    value={codeHTML}
    lang={html({
      selfClosingTags: true,
    })}
    on:change={e => {
      codeHTML = e.detail;
      updateIframe();
    }}
    styles={{
       "&": {
        maxWidth:maxWidth,
        maxHeight:"600px",
        minHeight:"400px",
       },
    }}
    />
    {:else if currentTab === 'css'}
    <CodeMirror
          bind:code={codeCSS}
          value={codeCSS}
          lang={css()}
          on:change={e => {
            codeCSS = `${e.detail}`;
            updateIframe();
          }}
          styles={{
            "&": {
              maxWidth:maxWidth,
              maxHeight:"600px",
              minHeight:"400px",
            },
          }}
        />
      {/if}
    </div>
    <div class="md:border-l-2 flex-1">
      <div class="flex bg-black p-2">
        <button on:click={() => currentResultTab = 'preview'} class="px-4 py-2 rounded text-sm {currentResultTab === 'preview' ? 'bg-white text-black': 'bg-gray-500 text-white'}">Preview</button>
        <button on:click={() => currentResultTab = 'image'} class="mx-4 px-4 py-2 rounded text-sm {currentResultTab === 'image' ? 'bg-white text-black': 'bg-gray-500 text-white'}">Image</button>
      </div>
      {#if currentResultTab  === 'preview'}
      <div class="overflow-auto">
        {#if previewFrame}
        
        <div class="flex gap-4 justify-center items-center p-2 bg-gray-200">
          <div>
            <label for ="scale" class="text-sm">scale</label>
            <input type="number" class=" border-black border-b-2 text-sm bg-gray-200 ml-1 text-center" value="1" min="0.1" max="2" step="0.1" on:input={(e) => {
              updateScale(e.target.value);
            }}/>
          </div>
          <div class="flex-grow">

          </div>
          <div>
            <input type="number" class=" border-black border-b-2 text-sm bg-gray-200  text-center" value="{parseInt(getComputedStyle(previewFrame).width.replace('px', ''))}" min="100" max="800" on:input={(e) => {
              previewFrame.style.width = `${e.target.value}px`;
            }}/>
          </div>
          <div class="text-m">
            X
          </div>
          <div>
            <input type="number" class="border-black border-b-2 text-sm bg-gray-200  text-center" value="{parseInt(getComputedStyle(previewFrame).height.replace('px', ''))}" min="100" max="600" on:input={(e) => {
              previewFrame.style.height = `${e.target.value}px`;
            }}/>
          </div>
        </div>
        {/if}
        <div  bind:this={iframeContainer}>
          <iframe  class="w-full min-h-[400px] max-h-[600px]" title="code-preview" srcdoc={getSrcDoc()} bind:this={previewFrame}/>
        </div>
      </div>
      {:else if currentResultTab === 'image'}
      <img src="https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png" alt="code-image" class="w-full min-h-[400px] max-h-[600px]"/>
      {/if}
    </div>
</section>
