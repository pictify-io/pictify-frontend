<script>
import { onMount } from 'svelte';
import CodeMirror from 'svelte-codemirror-editor';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';

let codeHTML ="<html><body><h1>Hello World</h1></body></html>";
let codeCSS = "h1{color:red;}";

let maxWidth = "45vw";
let currentTab = 'html';
let previewFrame ;

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
      <!DOCTYPE html>
      <html>
        <head>
          ${returnStyleTag(`[styleOpen]${codeCSS}[styleClose]`)}
        </head>
          ${codeHTML}
    </html>`;
  }

  function updateIframe() {
    if (previewFrame) {
      previewFrame.srcdoc = getSrcDoc();
    }
  }
</script>

<section>
  <div class="flex flex-col md:flex-row border-black border-4 w-[90vw] md:min-h-[400px] xl:min-h-[500px]">
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
            },
          }}
        />
      {/if}
    </div>
    <div class="border border-l-2 flex-1">
      <iframe  class="w-full" title="code-preview" srcdoc={getSrcDoc()} bind:this={previewFrame}/>
    </div>
</section>