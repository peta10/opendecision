'use client';

import React, { useState, useRef } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '@/ppm-tool/shared/lib/utils';
import { Criterion } from '@/ppm-tool/shared/types';
import { GeneralInfoSection, GeneralInfo } from './GeneralInfoSection';
import { CriteriaRatingSection } from './CriteriaRatingSection';

interface ProjectProfileSectionProps {
  criteria: Criterion[];
  onCriteriaChange: (criteria: Criterion[]) => void;
  onOpenGuidedRanking?: () => void;
  guidedButtonRef?: React.RefObject<HTMLButtonElement>;
}

export const ProjectProfileSection: React.FC<ProjectProfileSectionProps> = ({
  criteria,
  onCriteriaChange,
  onOpenGuidedRanking,
  guidedButtonRef,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Local state for General Information (Phase 1 - local only)
  const [generalInfo, setGeneralInfo] = useState<GeneralInfo>({
    userCount: '',
    methodologies: [],
    categories: '',
    productsToRemove: [],
    improvementObjectives: '',
    deadline: '',
    budget: 0,
    attachments: [],
  });

  const handleGuidedProfileClick = () => {
    onOpenGuidedRanking?.();
  };

  const handleAddCriteria = () => {
    // For now, just open guided ranking
    // In future, could open a modal to add custom criteria
    onOpenGuidedRanking?.();
  };

  return (
    <div
      ref={sectionRef}
      id="project-profile-section"
      className="bg-white rounded-lg shadow-lg flex flex-col h-full relative border border-gray-200"
      style={{ overflow: 'visible' }}
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Header */}
        <div
          className="flex-shrink-0 flex items-center justify-between border-b bg-white rounded-t-lg"
          style={{ padding: 'var(--section-padding, 1rem)', paddingBottom: 'calc(var(--section-padding, 1rem) * 0.75)' }}
        >
          <div className="flex items-center">
            <FileText className="w-5 h-5 md:w-6 md:h-6 mr-2 text-gray-600" />
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900">
              Project Profile
            </h2>
          </div>

          {/* Guided Profile Creation Button */}
          <button
            ref={guidedButtonRef}
            onClick={handleGuidedProfileClick}
            className={cn(
              'flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full',
              'hover:bg-gray-800 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2'
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-scout opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-scout"></span>
            </span>
            Guided profile creation
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto section-scroll">
          {/* General Information Section */}
          <GeneralInfoSection
            data={generalInfo}
            onChange={setGeneralInfo}
          />

          {/* Criteria Rating Section */}
          <CriteriaRatingSection
            criteria={criteria}
            onCriteriaChange={onCriteriaChange}
            onAddCriteria={handleAddCriteria}
          />

          {/* Bottom padding for scroll */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
};

export default ProjectProfileSection;
