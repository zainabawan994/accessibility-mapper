import React, { useState } from 'react';
import { CommunityReport, Place } from '../types/accessibility';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  ThumbsUp, 
  X, 
  Send,
  Building,
  Check
} from 'lucide-react';

interface CommunityFeedProps {
  reports: CommunityReport[];
  places?: Place[];
  onOpenScanner: () => void;
  onUpvoteReport: (reportId: string) => void;
  onSelectPlaceById?: (placeId: string) => void;
  onAddNewReport?: (report: CommunityReport) => void;
  highContrast: boolean;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({
  reports,
  places = [],
  onUpvoteReport,
  onSelectPlaceById,
  onAddNewReport,
  highContrast,
}) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(places[0]?.id || '');
  const [issueType, setIssueType] = useState<'stairs_barrier' | 'ramp' | 'elevator' | 'accessible_entrance'>('stairs_barrier');
  const [note, setNote] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPlace = places.find(p => p.id === selectedPlaceId) || places[0];
    if (!targetPlace) return;

    const newReport: CommunityReport = {
      id: `rep-${Date.now()}`,
      placeId: targetPlace.id,
      placeName: targetPlace.name,
      placeCategory: targetPlace.category,
      authorName: 'User Report',
      authorType: 'community_member',
      date: new Date().toISOString().split('T')[0],
      photoUrl: targetPlace.imageUrl,
      photoAlt: targetPlace.name,
      featureCategory: issueType,
      notes: note.trim() || (issueType === 'stairs_barrier' ? 'Physical stairs barrier reported.' : 'Accessibility verified.'),
      upvotes: 1,
      isVerified: true,
      aiClassification: {
        predictedCategory: issueType,
        predictedLabel: issueType === 'stairs_barrier' ? 'Stairs Barrier' : 'Accessible Entrance',
        confidence: 90,
        wasUserCorrected: false,
        complianceScore: issueType === 'stairs_barrier' ? 40 : 90,
      }
    };

    if (onAddNewReport) {
      onAddNewReport(newReport);
    }
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsReportModalOpen(false);
      setNote('');
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Simple Header */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-4 ${
        highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60 shadow-xs'
      }`}>
        <div>
          <h2 className="text-xl font-bold text-[#1E2548]">
            Accessibility Reports
          </h2>
          <p className="text-xs text-[#8697C4] mt-0.5">
            Recent updates on ramps, elevators, and stairs barriers reported by users.
          </p>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#3D52A0] hover:bg-[#293872] active:bg-[#1E2548] text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-2 shadow-sm min-h-[42px]"
        >
          <Plus className="w-4 h-4 text-[#EDE8F5]" />
          <span>Report an Issue</span>
        </button>
      </div>

      {/* Simple Reports List */}
      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#ADBBDA]/60 text-xs text-[#8697C4]">
            No reports yet. Click "Report an Issue" to report a barrier.
          </div>
        ) : (
          reports.map((report) => {
            const isBarrier = report.featureCategory === 'stairs_barrier';
            return (
              <div
                key={report.id}
                className={`p-4 rounded-2xl border transition-all ${
                  highContrast
                    ? 'bg-black text-white border-yellow-400'
                    : 'bg-white border-[#ADBBDA]/60 shadow-xs hover:border-[#7091E6]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#ADBBDA]/30">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                      isBarrier 
                        ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      {isBarrier ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                          <span>Barrier Reported</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Accessible</span>
                        </>
                      )}
                    </span>

                    <button
                      onClick={() => onSelectPlaceById && onSelectPlaceById(report.placeId)}
                      className="font-bold text-sm text-[#1E2548] hover:text-[#3D52A0] hover:underline"
                    >
                      {report.placeName}
                    </button>
                  </div>

                  <span className="text-xs text-[#8697C4]">{report.date}</span>
                </div>

                <div className="pt-2.5 flex items-center justify-between gap-4">
                  <p className="text-xs text-[#1E2548]/90 leading-relaxed flex-1">
                    {report.notes}
                  </p>

                  <button
                    onClick={() => onUpvoteReport(report.id)}
                    className="px-3 py-1.5 rounded-xl bg-[#EDE8F5]/60 hover:bg-[#EDE8F5] text-[#3D52A0] text-xs font-bold flex items-center gap-1.5 border border-[#ADBBDA]/50 transition-colors shrink-0"
                    title="Confirm this report"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-[#7091E6]" />
                    <span>{report.upvotes}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Simple Report Modal */}
      {isReportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white text-[#1E2548] border border-[#ADBBDA]/70 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ADBBDA]/40">
              <h3 className="font-bold text-base text-[#1E2548]">
                Report an Accessibility Issue
              </h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8697C4] hover:text-[#1E2548] hover:bg-[#EDE8F5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#1E2548] block mb-1">
                  1. Which Place?
                </label>
                <select
                  value={selectedPlaceId}
                  onChange={(e) => setSelectedPlaceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ADBBDA]/70 bg-white text-[#1E2548] font-medium focus:ring-2 focus:ring-[#7091E6] focus:outline-none"
                >
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#1E2548] block mb-1">
                  2. What is the Issue?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'stairs_barrier', label: 'Stairs / No Ramp', isWarning: true },
                    { id: 'elevator', label: 'Broken Elevator', isWarning: true },
                    { id: 'accessible_entrance', label: 'Door Too Narrow', isWarning: true },
                    { id: 'ramp', label: 'Ramp Verified OK', isWarning: false },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIssueType(item.id as any)}
                      className={`p-2.5 rounded-xl border font-bold text-center transition-all text-xs ${
                        issueType === item.id
                          ? 'bg-[#3D52A0] text-white border-[#3D52A0] shadow-xs'
                          : 'bg-[#EDE8F5]/50 text-[#1E2548] border-[#ADBBDA]/60 hover:bg-[#EDE8F5]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1E2548] block mb-1">
                  3. Details (Short Note)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Front ramp has construction, use side gate."
                  className="w-full px-3 py-2 rounded-xl border border-[#ADBBDA]/70 bg-white text-[#1E2548] focus:ring-2 focus:ring-[#7091E6] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#3D52A0] hover:bg-[#293872] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm min-h-[42px]"
                >
                  {isSubmitted ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Report Submitted!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-[#EDE8F5]" />
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
