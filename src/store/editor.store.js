import { derived, readable } from 'svelte/store';
import { assign, createActor, createMachine } from 'xstate';

const clampZoom = (value = 100) => Math.min(400, Math.max(10, value));

const editorMachine = createMachine(
	{
		id: 'editor',
		initial: 'ready',
		context: {
			canvas: null,
			selectedComponent: null,
			activeSidebarTab: 'elements',
			activeRightSidebarTab: 'properties',
			canvasZoom: 100
		},
		states: {
			ready: {
				on: {
					SET_CANVAS: { actions: 'setCanvas' },
					SELECT_COMPONENT: { actions: 'selectComponent' },
					CLEAR_SELECTION: { actions: 'clearSelection' },
					TOGGLE_LEFT_SIDEBAR_TAB: { actions: 'toggleLeftSidebar' },
					TOGGLE_RIGHT_SIDEBAR_TAB: { actions: 'toggleRightSidebar' },
					SET_CANVAS_ZOOM: { actions: 'setCanvasZoom' }
				}
			}
		}
	},
	{
		actions: {
			setCanvas: assign({
				canvas: ({ event }) => event?.canvas ?? null,
				selectedComponent: ({ context, event }) =>
					event?.canvas ? context.selectedComponent : null
			}),
			selectComponent: assign({
				selectedComponent: ({ event }) => event?.component ?? null
			}),
			clearSelection: assign({
				selectedComponent: () => null
			}),
			toggleLeftSidebar: assign({
				activeSidebarTab: ({ context, event }) =>
					context.activeSidebarTab === event?.tab ? null : event?.tab ?? null
			}),
			toggleRightSidebar: assign({
				activeRightSidebarTab: ({ context, event }) =>
					context.activeRightSidebarTab === event?.tab ? null : event?.tab ?? null
			}),
			setCanvasZoom: assign({
				canvasZoom: ({ event }) => clampZoom(event?.zoom)
			})
		}
	}
);

const editorActor = createActor(editorMachine);
editorActor.start();

const editorState = readable(editorActor.getSnapshot(), (set) => {
	set(editorActor.getSnapshot());
	const subscription = editorActor.subscribe((snapshot) => set(snapshot));
	return () => subscription.unsubscribe();
});

const selectContext = (selector) =>
	derived(editorState, ($state) => ($state ? selector($state.context) : null));

export const editor = selectContext((ctx) => ctx.canvas);
export const selectedComponent = selectContext((ctx) => ctx.selectedComponent);
export const activeSidebarTab = selectContext((ctx) => ctx.activeSidebarTab);
export const activeRightSidebarTab = selectContext((ctx) => ctx.activeRightSidebarTab);
export const canvasZoom = selectContext((ctx) => ctx.canvasZoom);

export const editorActions = {
	setCanvas: (canvas) => editorActor.send({ type: 'SET_CANVAS', canvas }),
	clearCanvas: () => editorActor.send({ type: 'SET_CANVAS', canvas: null }),
	selectComponent: (component) => editorActor.send({ type: 'SELECT_COMPONENT', component }),
	clearSelection: () => editorActor.send({ type: 'CLEAR_SELECTION' }),
	toggleLeftSidebarTab: (tab) => editorActor.send({ type: 'TOGGLE_LEFT_SIDEBAR_TAB', tab }),
	toggleRightSidebarTab: (tab) => editorActor.send({ type: 'TOGGLE_RIGHT_SIDEBAR_TAB', tab }),
	setCanvasZoom: (zoom) => editorActor.send({ type: 'SET_CANVAS_ZOOM', zoom })
};
