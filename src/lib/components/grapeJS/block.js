const initBlock = (editor) => {
	const blockManager = editor.BlockManager;

	blockManager.add('variable-image', {
		label: 'Variable Image',
		content: '<span><img src="{{image_url}}" alt="Variable Image"></span>',
		attributes: { class: 'fa fa-image' },
		category: 'Variable',
		activate: true,
		select: true,
		draggable: true,
		editable: true,
		resizable: true,
		copyable: true,
		pasteable: true
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
		]
	});
};

export default initBlock;
