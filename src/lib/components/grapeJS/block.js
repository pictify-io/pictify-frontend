const initBlock = (editor) => {
    const blockManager = editor.BlockManager;

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
                type: 'image',
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
};

export default initBlock;