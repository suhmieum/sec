import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentStore } from '../state/studentStore';
import { useClassroomStore } from '../state/classroomStore';
import { useStockStore } from '../state/stockStore';
import { useSavingsStore } from '../state/savingsStore';

export default function PortfolioSimple() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const { getStudent } = useStudentStore();
  const { getClassroom } = useClassroomStore();

  const student = studentId ? getStudent(studentId) : null;
  const classroom = student ? getClassroom(student.classroomId) : null;

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">학생을 찾을 수 없습니다</h2>
          <p className="text-gray-500 mb-4">잘못된 학생 ID이거나 학생 데이터가 없습니다.</p>
          <button
            onClick={() => navigate('/students')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            학생 관리로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{student.name}의 경제 활동 포트폴리오</h1>
            <p className="text-indigo-100">
              {classroom?.name} · 신용등급 {student.creditGrade} · {student.creditScore}점
            </p>
          </div>
          <button
            onClick={() => navigate('/students')}
            className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition"
          >
            돌아가기
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">현재 잔액</p>
              <p className="text-2xl font-bold text-gray-900">
                {student.balance.toLocaleString()}원
              </p>
            </div>
            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
              💰
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">신용점수</p>
              <p className="text-2xl font-bold text-gray-900">
                {student.creditScore}점
              </p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              📊
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">총 수입</p>
              <p className="text-2xl font-bold text-gray-900">
                {student.totalEarnings.toLocaleString()}원
              </p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              📈
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">달성 업적</p>
              <p className="text-2xl font-bold text-gray-900">
                {student.achievements?.length || 0}개
              </p>
            </div>
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
              🏆
            </div>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">학생 정보</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">이름</span>
              <span className="font-medium">{student.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">학급</span>
              <span className="font-medium">{classroom?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">신용등급</span>
              <span className="font-medium">{student.creditGrade}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">총 거래 횟수</span>
              <span className="font-medium">{student.totalTransactions}회</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">지각 횟수</span>
              <span className="font-medium">{student.lateCount}회</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">숙제 미제출</span>
              <span className="font-medium">{student.homeworkMissed}회</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">도서 연체</span>
              <span className="font-medium">{student.bookOverdue}회</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">가입일</span>
              <span className="font-medium">{new Date(student.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      {student.achievements && student.achievements.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">달성 업적</h3>
          <div className="grid grid-cols-3 gap-3">
            {student.achievements.map((achievement, idx) => (
              <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <div className="text-2xl mb-2">🏆</div>
                <p className="text-sm font-medium text-gray-800">{achievement}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate('/students')}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          학생 관리로 돌아가기
        </button>
        <button
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          disabled
        >
          상세 포트폴리오 (개발중)
        </button>
      </div>
    </div>
  );
}