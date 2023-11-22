import plugin from 'grapesjs-blocks-basic';
import { popularFontsLinks } from './style-sheet';


const swv = 'sw-visibility';
// const expt = 'export-template';
const osm = 'open-sm';
// const otm = 'open-tm';
// const ola = 'open-layers';
const obl = 'open-blocks';
// const ful = 'fullscreen';
const prv = 'preview';


const initConfig = {
    canvas: {
        styles: popularFontsLinks,

    },
    container: '#gjs',
    fromElement: true,
    height: '500px',
    width: '1000px',
    noticeOnUnload: 0,
    showDevices: false,
    components: false,
    deviceManager: false,
    showToolbar: false,
    editable: false,
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
                    // {
                    //     id: ful,
                    //     className: 'fa fa-arrows-alt',
                    //     command: ful,
                    //     context: ful,
                    //     attributes: { title: 'Fullscreen' }
                    // },
                    // {
                    // 	id: expt,
                    // 	className: 'fa fa-code',
                    // 	command: expt,
                    // 	attributes: { title: 'View code' }
                    // }
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
                flexGrid: true,
                editable: false
            })
    ]
}

export default initConfig;