import { derived, readable } from 'svelte/store';
import { assign, createActor, createMachine } from 'xstate';
import { Group, ActiveSelection } from 'fabric';

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
	setCanvasZoom: (zoom) => editorActor.send({ type: 'SET_CANVAS_ZOOM', zoom }),

	/**
	 * Group selected objects together
	 * Converts ActiveSelection to a Group while preserving positions
	 */
	groupSelected: (canvas) => {
		if (!canvas) return null;

		const activeSelection = canvas.getActiveObject();
		// FabricJS uses 'ActiveSelection' (PascalCase) for multi-selections
		const selectionType = activeSelection?.type?.toLowerCase();
		if (!activeSelection || selectionType !== 'activeselection') {
			console.warn('No multiple objects selected to group. Type:', activeSelection?.type);
			return null;
		}

		// Get all objects in the selection (copy the array)
		const objects = activeSelection.getObjects().concat();
		if (objects.length < 2) {
			console.warn('Need at least 2 objects to group');
			return null;
		}

		// Discard the active selection - this restores objects to canvas coordinates
		canvas.discardActiveObject();

		// Remove all objects from canvas
		objects.forEach(obj => canvas.remove(obj));

		// Create a new Group with the same objects
		// FabricJS Group constructor automatically positions objects relative to group center
		const group = new Group(objects, {
			// Generate unique ID for the group
			id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			// Custom properties for template logic
			isConditionGroup: true,
			subTargetCheck: true,
		});

		// Add group to canvas
		canvas.add(group);
		canvas.setActiveObject(group);
		canvas.requestRenderAll();

		// Update selection in store
		editorActor.send({ type: 'SELECT_COMPONENT', component: group });

		console.log('✅ Group created at', group.left, group.top);
		return group;
	},

	/**
	 * Ungroup a selected group
	 * Uses FabricJS's built-in _restoreObjectsState method
	 */
	ungroupSelected: (canvas) => {
		if (!canvas) return false;

		const group = canvas.getActiveObject();
		// FabricJS uses 'Group' (PascalCase) for groups
		const objectType = group?.type?.toLowerCase();
		if (!group || objectType !== 'group') {
			console.warn('Selected object is not a group. Type:', group?.type);
			return false;
		}

		// Get objects from the group (copy the array before modification)
		const objects = group._objects.concat();

		// Use FabricJS's built-in method to restore objects to canvas coordinates
		// This is the same method used in the double-click handler that works
		if (typeof group._restoreObjectsState === 'function') {
			group._restoreObjectsState();
		}

		// Remove the group from canvas
		canvas.remove(group);

		// Add each object back to canvas
		objects.forEach(obj => {
			canvas.add(obj);
		});

		// Create an active selection with all the ungrouped objects
		if (objects.length > 0) {
			const selection = new ActiveSelection(objects, { canvas });
			canvas.setActiveObject(selection);
			editorActor.send({ type: 'SELECT_COMPONENT', component: selection });
		} else {
			editorActor.send({ type: 'CLEAR_SELECTION' });
		}

		canvas.requestRenderAll();
		console.log('✅ Group ungrouped, objects:', objects.length);

		return true;
	}
};
