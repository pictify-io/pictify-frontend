const initPanel = (editor) => {
    const panelManager = editor.Panels;
    console.log(panelManager.getPanel('options'));
    panelManager.addPanel({
        id: 'create-image',
        visible: true,
        buttons: [
            {
                id: 'create-image',
                className:
                    'bg-#FFF4DA hover:bg-#FFF4DA text-white py-2 px-4 rounded button custom-editor-button',
                label: '<button>Create Image</button>',
                command: 'create-image',
                attributes: { title: 'Open Assets', type: 'button' }
            },
            {
                id: 'create-gif',
                className:
                    'bg-#FFF4DA hover:bg-#FFF4DA text-white py-2 px-4 rounded button custom-editor-button',
                label: '<button>Create Gif</button>',
                command: 'create-gif',
                attributes: { title: 'Open Assets', type: 'button' }
            }
        ]
    });
};

export default initPanel;
