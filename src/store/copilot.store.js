/**
 * Copilot Store
 * 
 * Svelte store for managing agentic copilot state
 */

import { writable, derived } from 'svelte/store';

/**
 * Copilot drawer UI state
 */
export const copilotDrawer = writable({
  isOpen: false,
  height: 400, // default height in pixels
  isMinimized: false
});

/**
 * Copilot execution state
 */
export const copilotExecution = writable({
  isActive: false,
  isLoading: false,
  currentSteps: [],
  currentStepIndex: 0,
  mode: 'manual', // 'manual' or 'auto'
  selfCorrectEnabled: true,
  error: null,
  threadId: null,
  checkpointId: null,
  needsUserInput: false
});

/**
 * Current step being viewed/approved
 */
export const currentStep = derived(
  copilotExecution,
  ($exec) => {
    if (!$exec.currentSteps || $exec.currentStepIndex >= $exec.currentSteps.length) {
      return null;
    }
    return $exec.currentSteps[$exec.currentStepIndex];
  }
);

/**
 * Check if execution is complete
 */
export const isExecutionComplete = derived(
  copilotExecution,
  ($exec) => {
    if (!$exec.currentSteps || $exec.currentSteps.length === 0) {
      return false;
    }
    return $exec.currentSteps.every(step => 
      step.status === 'validated' || step.status === 'approved'
    );
  }
);

/**
 * Copilot actions
 */
export const copilotActions = {
  /**
   * Start a new agentic execution
   */
  startExecution: (steps = []) => {
    copilotExecution.update(state => ({
      ...state,
      isActive: true,
      currentSteps: steps,
      currentStepIndex: 0,
      error: null,
      threadId: null,
      checkpointId: null,
      needsUserInput: false
    }));
  },
  
  /**
   * Approve the current step
   */
  approveStep: (stepIndex) => {
    copilotExecution.update(state => {
      const steps = [...state.currentSteps];
      if (steps[stepIndex]) {
        steps[stepIndex].status = 'approved';
      }
      return {
        ...state,
        currentSteps: steps,
        currentStepIndex: Math.min(stepIndex + 1, steps.length - 1)
      };
    });
  },
  
  /**
   * Reject the current step
   */
  rejectStep: (stepIndex, feedback) => {
    copilotExecution.update(state => {
      const steps = [...state.currentSteps];
      if (steps[stepIndex]) {
        steps[stepIndex].status = 'rejected';
        steps[stepIndex].userFeedback = feedback;
      }
      return {
        ...state,
        currentSteps: steps
      };
    });
  },
  
  /**
   * Clear execution state
   */
  clearExecution: () => {
    copilotExecution.set({
      isActive: false,
      isLoading: false,
      currentSteps: [],
      currentStepIndex: 0,
      mode: 'manual',
      selfCorrectEnabled: true,
      error: null,
      threadId: null,
      checkpointId: null,
      needsUserInput: false
    });
  },
  
  /**
   * Set loading state
   */
  setLoading: (isLoading) => {
    copilotExecution.update(state => ({
      ...state,
      isLoading
    }));
  },
  
  /**
   * Set error
   */
  setError: (error) => {
    copilotExecution.update(state => ({
      ...state,
      error,
      isLoading: false
    }));
  },

  upsertSteps: (incomingSteps = []) => {
    if (!incomingSteps || incomingSteps.length === 0) {
      return;
    }
    copilotExecution.update(state => {
      const merged = new Map();
      state.currentSteps.forEach(step => {
        merged.set(step.stepNumber, step);
      });
      incomingSteps.forEach(step => {
        if (!step?.stepNumber) {
          return;
        }
        const existing = merged.get(step.stepNumber) || {};
        merged.set(step.stepNumber, {
          ...existing,
          ...step
        });
      });
      const ordered = Array.from(merged.values()).sort(
        (a, b) => a.stepNumber - b.stepNumber
      );
      return {
        ...state,
        currentSteps: ordered,
        isActive: true,
        currentStepIndex: Math.max(0, ordered.length - 1)
      };
    });
  },

  setThreadContext: ({ threadId, checkpointId, needsUserInput }) => {
    copilotExecution.update(state => ({
      ...state,
      threadId: threadId ?? state.threadId,
      checkpointId: checkpointId ?? state.checkpointId,
      needsUserInput: typeof needsUserInput === 'boolean'
        ? needsUserInput
        : state.needsUserInput
    }));
  },

  /**
   * Drawer control actions
   */
  toggleDrawer: () => {
    copilotDrawer.update(state => ({
      ...state,
      isOpen: !state.isOpen,
      isMinimized: false
    }));
  },

  openDrawer: () => {
    copilotDrawer.update(state => ({
      ...state,
      isOpen: true,
      isMinimized: false
    }));
  },

  closeDrawer: () => {
    copilotDrawer.update(state => ({
      ...state,
      isOpen: false,
      isMinimized: false
    }));
  },

  minimizeDrawer: () => {
    copilotDrawer.update(state => ({
      ...state,
      isMinimized: true
    }));
  },

  maximizeDrawer: () => {
    copilotDrawer.update(state => ({
      ...state,
      isMinimized: false
    }));
  },

  setDrawerHeight: (height) => {
    copilotDrawer.update(state => ({
      ...state,
      height: Math.max(200, Math.min(height, window.innerHeight * 0.8))
    }));
  }
};
