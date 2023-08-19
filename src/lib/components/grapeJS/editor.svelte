<script>
	import { onMount } from 'svelte';
	import grapesjs from 'grapesjs';
	import plugin from 'grapesjs-blocks-basic';
	import 'grapesjs/dist/css/grapes.min.css';

	let editor;

	const swv = 'sw-visibility';
	const expt = 'export-template';
	const osm = 'open-sm';
	const otm = 'open-tm';
	const ola = 'open-layers';
	const obl = 'open-blocks';
	const ful = 'fullscreen';
	const prv = 'preview';

	onMount(() => {
		editor = grapesjs.init({
			container: '#gjs',
			fromElement: true,
			height: '400px',
			width: '900px',
			noticeOnUnload: 0,
			showDevices: false,
			components: false,
			showToolbar: false,
			panels: {
				defaults: [
					{
						id: 'commands',
						buttons: [{}]
					},
					{
						id: 'options',
						buttons: [
							{
								active: true,
								id: swv,
								className: 'fa fa-square-o',
								command: 'core:component-outline',
								context: swv,
								attributes: { title: 'View components' }
							},
							{
								id: prv,
								className: 'fa fa-eye',
								command: prv,
								context: prv,
								attributes: { title: 'Preview' }
							},
							{
								id: ful,
								className: 'fa fa-arrows-alt',
								command: ful,
								context: ful,
								attributes: { title: 'Fullscreen' }
							},
							{
								id: expt,
								className: 'fa fa-code',
								command: expt,
								attributes: { title: 'View code' }
							}
						]
					},
					{
						id: 'views',
						buttons: [
							{
								id: osm,
								className: 'fa fa-paint-brush',
								command: osm,

								togglable: false,
								attributes: { title: 'Open Style Manager' }
							},
							// {
							//   id: otm,
							//   className: 'fa fa-cog',
							//   command: otm,
							//   togglable: false,
							//   attributes: { title: 'Settings' },
							// },
							// {
							//   id: ola,
							//   className: 'fa fa-bars',
							//   command: ola,
							//   togglable: false,
							//   attributes: { title: 'Open Layer Manager' },
							// },
							{
								active: true,
								id: obl,
								className: 'fa fa-th-large',
								command: obl,
								togglable: false,
								attributes: { title: 'Open Blocks' }
							}
						]
					}
				]
			},
			defaultBlock: 'text',
			icons: {},
			storageManager: false,
			plugins: [
				(editor) =>
					plugin(editor, {
						blocks: ['column1', 'column2', 'column3', 'text', 'link', 'image', 'gif'],
						category: 'Basic',
						flexGrid: true
					})
			]
		});

		const panelManager = editor.Panels;
        const blockManager = editor.BlockManager;

		panelManager.addPanel({
			id: 'create-image',
			visible: true,
			buttons: [
				{
					id: 'create-image',
					className: 'bg-#FFF4DA hover:bg-#FFF4DA text-white py-2 px-4 rounded button custom-editor-button',
					label: '<button>Create Image</button>',
					command: 'open-assets',
					attributes: { title: 'Open Assets', type: 'button' }
				},
				{
					id: 'create-gif',
					className: 'bg-#FFF4DA hover:bg-#FFF4DA text-white py-2 px-4 rounded button custom-editor-button',
					label: '<button>Create Gif</button>',
					command: 'open-assets',
					attributes: { title: 'Open Assets', type: 'button' }
				}
			]
		});

        blockManager.add('variable-image', {
            label: 'Variable Image',
            content: '<img src="{{image_url}}" alt="Variable Image">',
            attributes: { class: 'fa fa-image' },
            category: 'Variable',
            activate: true,
            select: true,
            draggable: true,
            editable: true,
            resizable: true,
            copyable: true,
            pasteable: true,
            traits: [
                {
                    type: 'text',
                    label: 'Image URL',
                    name: 'image_url',
                    changeProp: 1
                }
            ],
            toHTML: function (data) {
                return this.get('content').replace('{{image_url}}', data.image_url);
            }
        });

        blockManager.add('variable-text', {
            label: 'Variable Text',
            content: '<span>{{text}}</span>',
            attributes: { class: 'fa fa-hashtag' },
            category: 'Variable',
            activate: true,
            select: true,
            draggable: true,
            editable: true,
            resizable: true,
            copyable: true,
            pasteable: true,
            traits: [
                {
                    type: 'text',
                    label: 'Text',
                    name: 'text',
                    changeProp: 1
                }
            ],
            toHTML: function (data) {
                return this.get('content').replace('{{text}}', data.text);
            }
        });
	});
</script>

<section class="flex-col justify-center items-center mx-auto py-10">
	<div class="min-w-300 min-h-300">
		<div id="gjs" />
	</div>
</section>

<style>

</style>
