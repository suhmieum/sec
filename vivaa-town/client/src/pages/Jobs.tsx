import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCurrentClassroom, useCurrentJobs, useJobStore } from '../state';
import type { Job } from '../schemas';

interface JobFormData {
  title: string;
  description: string;
  salary: number;
  maxPositions: number;
}

function Jobs() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const currentClass = useCurrentClassroom();
  const jobs = useCurrentJobs();
  const { createJob, updateJob, deleteJob } = useJobStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<JobFormData>();

  const onSubmit = (data: JobFormData) => {
    if (!currentClass) return;

    if (editingJob) {
      // Update existing job
      updateJob(editingJob.id, {
        title: data.title,
        description: data.description,
        salary: data.salary,
        maxPositions: data.maxPositions,
      });
    } else {
      // Create new job
      createJob({
        classroomId: currentClass.id,
        title: data.title,
        description: data.description,
        salary: data.salary,
        maxPositions: data.maxPositions,
      });
    }

    setIsCreating(false);
    setEditingJob(null);
    reset();
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setIsCreating(true);
    reset({
      title: job.title,
      description: job.description,
      salary: job.salary,
      maxPositions: job.maxPositions,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('정말 이 직업을 삭제하시겠습니까?')) {
      deleteJob(id);
    }
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingJob(null);
    reset();
  };

  // 기본 직업 템플릿
  const createDefaultJobs = () => {
    if (!currentClass) return;

    const defaultJobs = [
      { title: '은행원', description: '은행 업무 담당', salary: 3000, maxPositions: 2 },
      { title: '경찰', description: '질서 유지 담당', salary: 2500, maxPositions: 2 },
      { title: '상점 직원', description: '아이템 판매 담당', salary: 2000, maxPositions: 3 },
      { title: '기자', description: '학급 소식 전달', salary: 1500, maxPositions: 2 },
      { title: '세무관', description: '세금 관리 담당', salary: 2500, maxPositions: 1 },
      { title: '시장', description: '학급 대표', salary: 4000, maxPositions: 1 },
    ];

    defaultJobs.forEach(jobTemplate => {
      createJob({
        classroomId: currentClass.id,
        title: jobTemplate.title,
        description: jobTemplate.description,
        salary: jobTemplate.salary,
        maxPositions: jobTemplate.maxPositions,
      });
    });
  };

  if (!currentClass) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">학급이 선택되지 않았습니다</h3>
        <p className="mt-1 text-sm text-gray-500">
          먼저 학급을 생성하거나 선택하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">직업 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            {currentClass.name} - 총 {jobs.length}개 직업
          </p>
        </div>
        <div className="flex space-x-3">
          {jobs.length === 0 && (
            <button
              onClick={createDefaultJobs}
              className="inline-flex items-center px-5 py-3 border-0 text-sm font-medium rounded-xl text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              기본 직업 생성
            </button>
          )}
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-5 py-3 border-0 text-sm font-medium rounded-xl text-white bg-accent-500 hover:bg-accent-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            새 직업 추가
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-gray-100/50 sm:rounded-2xl border-0">
          <div className="px-6 py-6 sm:p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingJob ? '직업 정보 수정' : '새 직업 추가'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    직업명 *
                  </label>
                  <input
                    type="text"
                    {...register('title', { required: '직업명을 입력하세요' })}
                    className="mt-1 block w-full border-gray-200 rounded-xl shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-gray-50 transition-all duration-200 sm:text-sm"
                    placeholder="예: 은행원, 경찰, 상점 직원 등"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    급여 ({currentClass.currencyUnit}) *
                  </label>
                  <input
                    type="number"
                    {...register('salary', {
                      required: '급여를 입력하세요',
                      min: { value: 0, message: '급여는 0 이상이어야 합니다' }
                    })}
                    className="mt-1 block w-full border-gray-200 rounded-xl shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-gray-50 transition-all duration-200 sm:text-sm"
                    placeholder="2000"
                  />
                  {errors.salary && (
                    <p className="mt-1 text-sm text-red-600">{errors.salary.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    최대 인원 *
                  </label>
                  <input
                    type="number"
                    {...register('maxPositions', {
                      required: '최대 인원을 입력하세요',
                      min: { value: 1, message: '최대 인원은 1명 이상이어야 합니다' }
                    })}
                    className="mt-1 block w-full border-gray-200 rounded-xl shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-gray-50 transition-all duration-200 sm:text-sm"
                    placeholder="2"
                  />
                  {errors.maxPositions && (
                    <p className="mt-1 text-sm text-red-600">{errors.maxPositions.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  직업 설명
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full border-gray-200 rounded-xl shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-gray-50 transition-all duration-200 sm:text-sm"
                  placeholder="이 직업의 역할과 책임을 설명해주세요"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-6 py-3 border-0 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 border-0 rounded-xl text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  {editingJob ? '수정하기' : '추가하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-gray-100/50 overflow-hidden sm:rounded-2xl border-0">
        <div className="px-6 py-6 sm:px-8">
          <h3 className="text-lg font-semibold text-gray-900">직업 목록</h3>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 002 2h2a2 2 0 002-2V6M8 4v2a2 2 0 002 2h4a2 2 0 002-2V4M8 4H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2"
              />
            </svg>
            <p className="mt-2 text-gray-500">아직 생성된 직업이 없습니다.</p>
            <div className="mt-6">
              <button
                onClick={createDefaultJobs}
                className="inline-flex items-center px-6 py-3 border-0 text-sm font-medium rounded-xl text-white bg-accent-500 hover:bg-accent-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                기본 직업 생성
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white/60 backdrop-blur-sm border-0 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-medium text-gray-900">{job.title}</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(job)}
                      className="text-accent-500 hover:text-accent-700 font-medium text-sm"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="text-red-500 hover:text-red-700 font-medium text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {job.description && (
                  <p className="text-gray-600 text-sm mb-3">{job.description}</p>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between text-sm bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-600 font-medium">급여</span>
                    <span className="font-semibold text-gray-900">
                      {job.salary.toLocaleString()}{currentClass.currencyUnit}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-600 font-medium">인원</span>
                    <span className="font-semibold text-gray-900">
                      {job.currentPositions} / {job.maxPositions}명
                    </span>
                  </div>

                  {job.currentPositions >= job.maxPositions && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                      정원 마감
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Jobs;