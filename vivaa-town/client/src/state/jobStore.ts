import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { storageAdapter } from '../storage/adapter';
import { STORAGE_KEYS } from '../storage/keys';
import { generateId } from '../utils';
import {
  JobSchema,
  type Job,
  type ID
} from '../schemas';

interface JobState {
  // State
  jobs: Job[];
  isLoading: boolean;

  // Actions
  loadJobs: () => void;
  setJobs: (jobs: Job[]) => void; // For demo data import
  createJob: (data: {
    id?: ID; // Optional id for demo data
    classroomId: ID;
    title: string;
    description?: string;
    salary: number;
    maxPositions: number;
    currentPositions?: number;
  }) => Job;
  updateJob: (id: ID, data: Partial<Omit<Job, 'id'>>) => void;
  deleteJob: (id: ID) => void;
  getJob: (id: ID) => Job | undefined;
  getJobsByClassroom: (classroomId: ID) => Job[];

  // Position management
  assignPosition: (jobId: ID) => boolean; // returns false if no positions available
  unassignPosition: (jobId: ID) => void;
  updateCurrentPositions: (jobId: ID, count: number) => void;
}

export const useJobStore = create<JobState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    jobs: [],
    isLoading: false,

    // Load jobs from storage
    loadJobs: () => {
      try {
        set({ isLoading: true });
        const stored = storageAdapter.get<Job[]>(STORAGE_KEYS.JOBS) ?? [];

        // Validate each job
        const validJobs = stored
          .map(job => {
            try {
              return JobSchema.parse(job);
            } catch (error) {
              console.warn('Invalid job data:', job, error);
              return null;
            }
          })
          .filter((job): job is Job => job !== null);

        set({ jobs: validJobs, isLoading: false });
      } catch (error) {
        console.error('Failed to load jobs:', error);
        set({ jobs: [], isLoading: false });
      }
    },

    // Set jobs directly (for demo data import)
    setJobs: (jobs) => {
      try {
        // Validate all jobs
        const validJobs = jobs.map(job => JobSchema.parse(job));
        set({ jobs: validJobs });
        storageAdapter.set(STORAGE_KEYS.JOBS, validJobs);
      } catch (error) {
        console.error('Failed to set jobs:', error);
      }
    },

    // Create new job
    createJob: (data) => {
      const newJob: Job = {
        id: data.id || generateId(), // Use provided id if available, otherwise generate
        classroomId: data.classroomId,
        title: data.title,
        description: data.description,
        salary: data.salary,
        maxPositions: data.maxPositions,
        currentPositions: data.currentPositions ?? 0,
      };

      // Validate the new job
      const validatedJob = JobSchema.parse(newJob);

      set(state => {
        const updated = [...state.jobs, validatedJob];
        storageAdapter.set(STORAGE_KEYS.JOBS, updated);
        return { jobs: updated };
      });

      return validatedJob;
    },

    // Update job
    updateJob: (id, data) => {
      set(state => {
        const updated = state.jobs.map(job => {
          if (job.id === id) {
            const updatedJob = { ...job, ...data };

            // Validate the updated job
            try {
              return JobSchema.parse(updatedJob);
            } catch (error) {
              console.error('Invalid job update:', error);
              return job; // Return original if validation fails
            }
          }
          return job;
        });

        storageAdapter.set(STORAGE_KEYS.JOBS, updated);
        return { jobs: updated };
      });
    },

    // Delete job
    deleteJob: (id) => {
      set(state => {
        const updated = state.jobs.filter(job => job.id !== id);
        storageAdapter.set(STORAGE_KEYS.JOBS, updated);
        return { jobs: updated };
      });
    },

    // Get job by ID
    getJob: (id) => {
      return get().jobs.find(job => job.id === id);
    },

    // Get jobs by classroom
    getJobsByClassroom: (classroomId) => {
      return get().jobs.filter(job => job.classroomId === classroomId);
    },

    // Assign position
    assignPosition: (jobId) => {
      const job = get().getJob(jobId);
      if (!job || job.currentPositions >= job.maxPositions) {
        return false;
      }

      get().updateJob(jobId, { currentPositions: job.currentPositions + 1 });
      return true;
    },

    // Unassign position
    unassignPosition: (jobId) => {
      const job = get().getJob(jobId);
      if (job && job.currentPositions > 0) {
        get().updateJob(jobId, { currentPositions: job.currentPositions - 1 });
      }
    },

    // Update current positions
    updateCurrentPositions: (jobId, count) => {
      const job = get().getJob(jobId);
      if (job) {
        const validCount = Math.max(0, Math.min(count, job.maxPositions));
        get().updateJob(jobId, { currentPositions: validCount });
      }
    },
  }))
);

// Auto-persist jobs on changes
useJobStore.subscribe(
  (state) => state.jobs,
  (jobs) => {
    storageAdapter.set(STORAGE_KEYS.JOBS, jobs);
  }
);