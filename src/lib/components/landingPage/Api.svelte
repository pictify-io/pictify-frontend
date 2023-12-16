<script>
	import FileIcon from '$lib/assets/landing-page/file.svg';
	import Prism from 'prismjs';
	import 'prismjs/components/prism-markup';
	import 'prismjs/components/prism-markup-templating';
	import 'prismjs/components/prism-javascript';
	import 'prismjs/components/prism-go';
	import 'prismjs/components/prism-python';
	import 'prismjs/components/prism-php';
	import 'prismjs/plugins/line-numbers/prism-line-numbers';
	import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

	import 'prismjs/themes/prism-tomorrow.css';

	import { afterUpdate } from 'svelte';

	let activeTab = 'js';

	const codeLanguageMap = {
		js: `const axios = require('axios');

const data = JSON.stringify({
	"html": "<html><body><h1>Hello World</h1></body></html>"
});

const header = {
	Authorization: 'Bearer access_token',
}

const config = {
	method: 'post',
	url: 'https://api.medify.com/image',
	headers: header,
	data: data
};

const image = await axios(config);
`,
		go: `package main

import (
    "bytes"
    "fmt"
    "io/ioutil"
    "net/http"
)

func main() {
    url := "https://api.medify.com/image"

    payload := []byte('{
		"html": "<html><body><h1>Hello World</h1></body></html>"
	}')

    req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer access_token")
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        fmt.Println(err)
        return
    }
    defer resp.Body.Close()

    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
}
`,
		py: `import requests
import json

url = 'https://api.medify.com/image'

payload = {'html': 'Hello World'}

headers = {
	'Authorization': 'Bearer access_token', 
	'Content-Type': 'application/json'
}

response = requests.post(url, data=json.dumps(payload), headers=headers)

image = response.json()
`,
		php: `<?php

$url = 'https://api.medify.com/image';
$data = json_encode(array('html' => 'Hello World'));
$header = array(
    'Authorization: Bearer access_token',
    'Content-Type: application/json'
);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$image = json_decode($response);

?>
`
	};

	function changeTab(tab) {
		activeTab = tab;
	}
	$: highlightedCode = Prism.highlight(
		codeLanguageMap[activeTab],
		Prism.languages[activeTab],
		activeTab
	);

	afterUpdate(() => {
		Prism.highlightAll();
	});
</script>

<div
	class="w-full flex justify-center flex-col sm: px-6 max-w-4xl space-y-8 w-100 mx-auto mb-8 py-10"
>
	<div class="">
		<div>
			<div class="text-5xl font-bold text-left md:text-center">
				<p>Easy To Use API</p>
			</div>
			<div class="text-lg opacity-50 max-w-3xl text-left md:text-center my-8">
				<p class="">
					Medify's API is easy to use and can be integrated into your existing workflow in minutes.
					Create Image's and GIF's from HTML with a simple POST request.
				</p>
			</div>
		</div>
		<div class="hidden sm:block w-full my-8 overflow-x-auto">
			<div class="bg-black w-100 rounded-t flex flex-wrap">
				<div class="w-3 h-3 bg-red-400 rounded-full m-2 mr-0" />
				<div class="w-3 h-3 bg-yellow-400 rounded-full m-2 mr-0" />
				<div class="w-3 h-3 bg-green-400 rounded-full m-2 mr-0" />
			</div>
			<div class="border border-gray-500 border-t-0 mt-n2 bg-gray-300 rounded-b py-0">
				<div class="flex w-100 bg-gray-100">
					<button
						class="flex items-center bg-gray-200 border-r-2 border-gray-300 focus:bg-gray-300 p-1"
						on:click={() => changeTab('js')}
					>
						<img src={FileIcon} alt="File icon" class="w-4 h-4" />
						<span class="ml-1">medify.js</span>
					</button>
					<button
						class="flex items-center bg-gray-200 border-r-2 border-gray-300 focus:bg-gray-300 p-1"
						on:click={() => changeTab('go')}
					>
						<img src={FileIcon} alt="File icon" class="w-4 h-4" />
						<span class="ml-1">medify.go</span>
					</button>
					<button
						class="flex items-center bg-gray-200 border-r-2 border-gray-300 focus:bg-gray-300 p-1"
						on:click={() => changeTab('py')}
					>
						<img src={FileIcon} alt="File icon" class="w-4 h-4" />
						<span class="ml-1">medify.py</span>
					</button>
					<button
						class="flex items-center bg-gray-200 border-r-2 border-gray-300 focus:bg-gray-300 p-1"
						on:click={() => changeTab('php')}
					>
						<img src={FileIcon} alt="File icon" class="w-4 h-4" />
						<span class="ml-1">medify.php</span>
					</button>
				</div>
				<div class="text-black-400 flex p-2 min-w-5 whitespace-pre-wrap max-h-xs">
					{#each Object.keys(codeLanguageMap) as language}
						{#if language === activeTab}
							<pre class="bg-gray-300 w-full line-numbers language-{activeTab}"><code
									>{@html highlightedCode}</code
								></pre>
						{/if}
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
