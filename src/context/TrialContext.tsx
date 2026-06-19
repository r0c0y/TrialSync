'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useBandWebSocket, WsMessage } from '@/hooks/useBandWebSocket';

export interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  content: string;
  timestamp: string;
  type: 'chat' | 'thought' | 'command' | 'system' | 'error' | 'success';
  reasoningPath?: {
    thought: string;
    action: string;
    observation: string;
    decision: string;
  };
  status?: string;
}

interface TrialContextType {
  trialId: string;
  data: any;
  loading: boolean;
  fetchData: () => Promise<void>;
  
  introduceConflict: boolean;
  setIntroduceConflict: (v: boolean) => void;
  
  pipelineRunning: boolean;
  setPipelineRunning: (v: boolean) => void;
  
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  
  currentPipelineAgent: 'scout' | 'designer' | 'statistical' | 'reviewer' | 'orchestrator' | null;
  setCurrentPipelineAgent: (agent: 'scout' | 'designer' | 'statistical' | 'reviewer' | 'orchestrator' | null) => void;
  
  wsUrl: string;
  setWsUrl: (url: string) => void;
  
  runPipeline: () => Promise<void>;
  
  inspectorAgent: 'scout' | 'designer' | 'statistical' | 'reviewer' | null;
  setInspectorAgent: (agent: 'scout' | 'designer' | 'statistical' | 'reviewer' | null) => void;
  
  // Search states & handlers
  pubMedQuery: string;
  setPubMedQuery: (v: string) => void;
  pubMedSearching: boolean;
  handlePubMedSearch: (e: React.FormEvent) => Promise<void>;
  
  ctCondition: string;
  setCtCondition: (v: string) => void;
  ctSearching: boolean;
  handleClinicalTrialsSearch: (e: React.FormEvent) => Promise<void>;
  
  fdaDrugName: string;
  setFdaDrugName: (v: string) => void;
  fdaSearching: boolean;
  handleFDASearch: (e: React.FormEvent) => Promise<void>;
  
  // Edit Protocol states & handlers
  isEditingProtocol: boolean;
  setIsEditingProtocol: (v: boolean) => void;
  editedProtocolTitle: string;
  setEditedProtocolTitle: (v: string) => void;
  editedInclusionCriteria: string;
  setEditedInclusionCriteria: (v: string) => void;
  editedExclusionCriteria: string;
  setEditedExclusionCriteria: (v: string) => void;
  editedPrimaryEndpoint: string;
  setEditedPrimaryEndpoint: (v: string) => void;
  editedAssumptions: string;
  setEditedAssumptions: (v: string) => void;
  handleStartEditProtocol: () => void;
  handleSaveProtocol: () => Promise<void>;
  
  // Edit SAP states & handlers
  isEditingSap: boolean;
  setIsEditingSap: (v: boolean) => void;
  editedAnalysisPopulation: string;
  setEditedAnalysisPopulation: (v: string) => void;
  editedPrimaryStatisticalMethod: string;
  setEditedPrimaryStatisticalMethod: (v: string) => void;
  editedCalculatedSampleSize: string;
  setEditedCalculatedSampleSize: (v: string) => void;
  editedAssumedActiveEfficacy: number;
  setEditedAssumedActiveEfficacy: (v: number) => void;
  editedAssumedPlaceboEfficacy: number;
  setEditedAssumedPlaceboEfficacy: (v: number) => void;
  editedAlpha: number;
  setEditedAlpha: (v: number) => void;
  editedPower: number;
  setEditedPower: (v: number) => void;
  editedEndpointValidation: string;
  setEditedEndpointValidation: (v: string) => void;
  handleStartEditSap: () => void;
  handleSaveSap: () => Promise<void>;
  
  // Conflict resolution
  resolutionRationals: { [key: string]: string };
  setResolutionRationals: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  handleResolveConflict: (conflictId: string, option: 'ACCEPT_RECOMMENDATION' | 'IGNORE_CONFLICT' | 'OVERRIDE') => Promise<void>;
  
  // Chat console UI
  chatInput: string;
  setChatInput: (v: string) => void;
  expandedReasoning: { [key: string]: boolean };
  setExpandedReasoning: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  toggleReasoning: (msgId: string) => void;
  isChatMaximized: boolean;
  setIsChatMaximized: (v: boolean) => void;
  handleSendCommand: (e: React.FormEvent) => Promise<void>;
  
  // Band Integration states & methods
  bandRooms: any[];
  fetchingRooms: boolean;
  selectedRoomId: string;
  setSelectedRoomId: (v: string) => void;
  bandError: string | null;
  linking: boolean;
  testSending: boolean;
  fetchBandRooms: () => Promise<void>;
  handleCreateBandRoom: () => Promise<void>;
  handleLinkBandRoom: (roomId: string) => Promise<void>;
  handleUnlinkBandRoom: () => Promise<void>;
  handleSendTestMessage: () => Promise<void>;
  agentKeys: Record<string, string>;
  setAgentKeys: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  
  // WebSocket live messages
  liveBandMessages: WsMessage[];
  bandConnected: boolean;
  bandWsError: string | null;
  
  // Upload states
  uploading: boolean;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

const TrialContext = createContext<TrialContextType | undefined>(undefined);

export function useTrial() {
  const context = useContext(TrialContext);
  if (!context) {
    throw new Error('useTrial must be used within a TrialProvider');
  }
  return context;
}

export function TrialProvider({ trialId, children }: { trialId: string; children: ReactNode }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [introduceConflict, setIntroduceConflict] = useState(true);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentPipelineAgent, setCurrentPipelineAgent] = useState<'scout' | 'designer' | 'statistical' | 'reviewer' | 'orchestrator' | null>(null);
  const [wsUrl, setWsUrl] = useState<string>('');
  const [inspectorAgent, setInspectorAgent] = useState<'scout' | 'designer' | 'statistical' | 'reviewer' | null>(null);

  // Search states
  const [pubMedQuery, setPubMedQuery] = useState('');
  const [pubMedSearching, setPubMedSearching] = useState(false);
  const [ctCondition, setCtCondition] = useState('');
  const [ctSearching, setCtSearching] = useState(false);
  const [fdaDrugName, setFdaDrugName] = useState('');
  const [fdaSearching, setFdaSearching] = useState(false);

  // Edit states
  const [isEditingProtocol, setIsEditingProtocol] = useState(false);
  const [editedProtocolTitle, setEditedProtocolTitle] = useState('');
  const [editedInclusionCriteria, setEditedInclusionCriteria] = useState('');
  const [editedExclusionCriteria, setEditedExclusionCriteria] = useState('');
  const [editedPrimaryEndpoint, setEditedPrimaryEndpoint] = useState('');
  const [editedAssumptions, setEditedAssumptions] = useState('');

  const [isEditingSap, setIsEditingSap] = useState(false);
  const [editedAnalysisPopulation, setEditedAnalysisPopulation] = useState('');
  const [editedPrimaryStatisticalMethod, setEditedPrimaryStatisticalMethod] = useState('');
  const [editedCalculatedSampleSize, setEditedCalculatedSampleSize] = useState('');
  const [editedAssumedActiveEfficacy, setEditedAssumedActiveEfficacy] = useState(0.65);
  const [editedAssumedPlaceboEfficacy, setEditedAssumedPlaceboEfficacy] = useState(0.40);
  const [editedAlpha, setEditedAlpha] = useState(0.05);
  const [editedPower, setEditedPower] = useState(0.80);
  const [editedEndpointValidation, setEditedEndpointValidation] = useState('');

  // Conflict resolution states
  const [resolutionRationals, setResolutionRationals] = useState<{ [key: string]: string }>({});

  // Chat UI states
  const [chatInput, setChatInput] = useState('');
  const [expandedReasoning, setExpandedReasoning] = useState<{ [key: string]: boolean }>({});
  const [isChatMaximized, setIsChatMaximized] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);

  // Band state
  const [bandRooms, setBandRooms] = useState<any[]>([]);
  const [fetchingRooms, setFetchingRooms] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [bandError, setBandError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [agentKeys, setAgentKeys] = useState<Record<string, string>>({});

  const trial = data?.trial || null;
  const protocol = data?.protocol || null;
  const sap = data?.sap || null;
  const conflicts = data?.conflicts || [];

  // Live WebSocket hook integration at the context provider level
  const { messages: liveBandMessages, connected: bandConnected, error: bandWsError } = useBandWebSocket({
    roomId: trial?.band_room_id || null,
    wsUrl,
    enabled: !!trial?.band_room_id,
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/trials/${trialId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.trial?.band_room_id && json.wsUrl) {
          setWsUrl(json.wsUrl);
        }
        
        // Auto-create Band room if missing
        if (json.trial && !json.trial.band_room_id) {
          try {
            const roomRes = await fetch('/api/band/link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ trialId, action: 'CREATE_ROOM' }),
            });
            const roomJson = await roomRes.json();
            if (!roomJson.error) {
              const refetch = await fetch(`/api/trials/${trialId}`);
              const refetchJson = await refetch.json();
              if (refetchJson.trial) {
                setData(refetchJson);
                if (refetchJson.trial.band_room_id && refetchJson.wsUrl) {
                  setWsUrl(refetchJson.wsUrl);
                }
              }
            }
          } catch {
            // Silently fail, band link is non-critical
          }
        }
      }
    } catch (err) {
      console.error('Error fetching trial data context:', err);
    } finally {
      setLoading(false);
    }
  }, [trialId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-hydrate conversation chat log from trial audit trail
  const rehydrateChatHistory = useCallback((trail: any[], eb: any, prot: any, sp: any, con: any) => {
    const history: ChatMessage[] = [];
    const sortedTrail = [...trail].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    sortedTrail.forEach((log) => {
      const timeStr = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (log.action === 'FILE_UPLOAD') {
        history.push({
          id: `hist-${log.id}`,
          sender: 'System',
          role: 'Audit Log',
          content: `Ingested literature document: "${log.change_description.replace('Uploaded file: ', '')}"`,
          timestamp: timeStr,
          type: 'system'
        });
      } else if (log.action === 'AGENT_START') {
        history.push({
          id: `hist-${log.id}`,
          sender: 'Decision Orchestrator',
          role: 'Lead Orchestrator',
          content: `Command dispatched: Run ${log.role}`,
          timestamp: timeStr,
          type: 'thought'
        });
      } else if (log.action === 'AGENT_COMPLETE') {
        let agentName = log.role;
        let reasoningPath = undefined;
        
        if (agentName.includes('Literature')) {
          const sigs = eb?.content_json?.safety_signals || [];
          const effs = eb?.content_json?.efficacy || [];
          reasoningPath = {
            thought: `Extract safety signals and efficacy endpoints from ${log.record_type || 'literature'} to build evidence base for protocol design.`,
            action: 'Analyzed uploaded documents for safety signals, efficacy rates, and population criteria.',
            observation: sigs.length > 0
              ? `Found ${sigs.length} safety signals (${sigs.filter((s: any) => s.severity === 'HIGH').length} critical) and ${effs.length} efficacy endpoints.`
              : 'Extracted literature insights for evidence brief compilation.',
            decision: 'Published Evidence Brief. Ready for Protocol Designer.'
          };
        } else if (agentName.includes('Protocol')) {
          const excCount = prot?.sections_json?.exclusion_criteria?.length || 0;
          reasoningPath = {
            thought: 'Build protocol criteria aligned with evidence safety signals and efficacy findings.',
            action: 'Compiled inclusion/exclusion criteria and endpoint selection from evidence brief.',
            observation: excCount > 0
              ? `Designed protocol with ${prot?.sections_json?.inclusion_criteria?.length || 0} inclusion criteria, ${excCount} exclusion criteria, endpoint: ${prot?.sections_json?.primary_endpoint || 'defined'}.`
              : 'Protocol draft created from evidence parameters.',
            decision: 'Generated Protocol v1.0. Ready for Statistical Analysis.'
          };
        } else if (agentName.includes('Statistical')) {
          const power = sp?.content_json?.power_calculation?.power;
          const sampleSize = sp?.content_json?.power_calculation?.calculated_sample_size;
          reasoningPath = {
            thought: 'Validate protocol endpoint timing and calculate required sample size for statistical power.',
            action: `Calculated sample size using ${sp?.content_json?.primary_statistical_method || 'chi-square'} with ${sp?.content_json?.power_calculation?.alpha || 0.05} alpha.`,
            observation: sampleSize
              ? `Power: ${(power * 100) || 80}%. Required: ${sampleSize}. ${(sp?.content_json?.endpoint_validation || '').includes('WARNING') ? '⚠ Endpoint timing flagged for review.' : '✓ Endpoint validated.'}`
              : 'Statistical power calculations completed for protocol endpoints.',
            decision: 'Created SAP v1.0 with power analysis and endpoint validation.'
          };
        } else if (agentName.includes('Regulatory')) {
          const openCount = con ? con.filter((c: any) => c.status === 'OPEN').length : 0;
          reasoningPath = {
            thought: 'Audit protocol and SAP against evidence brief for safety, consistency, and compliance gaps.',
            action: 'Cross-referenced safety thresholds, exclusion criteria, and endpoint timing across all three documents.',
            observation: openCount > 0
              ? `Found ${openCount} conflict${openCount > 1 ? 's' : ''} between evidence and protocol design. Human review required.`
              : 'All documents aligned. No compliance gaps detected.',
            decision: openCount > 0
              ? `Flagged ${openCount} issue${openCount > 1 ? 's' : ''} for human triage in Conflicts Hub.`
              : 'Status: APPROVED. Ready for IND submission.'
          };
        }
        
        history.push({
          id: `hist-${log.id}`,
          sender: log.role,
          role: 'AI Specialist',
          content: log.change_description,
          timestamp: timeStr,
          type: 'chat',
          reasoningPath
        });
      } else if (log.action === 'CONFLICT_RESOLVE') {
        history.push({
          id: `hist-${log.id}`,
          sender: 'Human Lead',
          role: 'Lead Clinician',
          content: `Resolved conflict: ${log.change_description.split('. Details: ')[0]}. Rationale: "${log.reason}"`,
          timestamp: timeStr,
          type: 'success'
        });
      } else if (log.action === 'BAND_ROOM_LINK' || log.action === 'BAND_ROOM_CREATE') {
        history.push({
          id: `hist-${log.id}`,
          sender: 'System',
          role: 'Integration',
          content: `Band.ai room linked successfully. Real-time updates active.`,
          timestamp: timeStr,
          type: 'system'
        });
      }
    });
    
    if (history.length === 0) {
      const openConCount = Array.isArray(con) ? con.filter((c: any) => c.status === 'OPEN').length : 0;
      const hasConflicts = openConCount > 0;
      history.push({
        id: 'init-msg',
        sender: 'Workspace Assistant',
        role: 'Lead Orchestrator',
        content: `Trial workspace ready.\n• ${eb ? 'Evidence Brief compiled ✅' : 'No evidence yet'}\n• ${prot ? 'Protocol drafted ✅' : 'Protocol pending'}\n• ${sp ? 'SAP complete ✅' : 'SAP pending'}\n• ${openConCount} open conflicts${hasConflicts ? ' ⚠️' : ''}\n\n${!eb ? 'Upload literature in the Evidence tab, then press **Run** to start.' : hasConflicts ? 'Open conflicts need resolution. Type /fix all or visit the Conflicts tab.' : 'Press **Run** to start the multi-agent pipeline, or ask me anything.'}\n\n> Type /help for commands`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'chat'
      });
    }
    
    setChatHistory(history);
  }, []);

  useEffect(() => {
    if (data?.auditTrail && chatHistory.length === 0) {
      rehydrateChatHistory(
        data.auditTrail,
        data.evidenceBrief,
        data.protocol,
        data.sap,
        data.conflicts
      );
    }
  }, [data, chatHistory.length, rehydrateChatHistory]);

  // Polling for progress updates when pipeline is running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pipelineRunning) {
      interval = setInterval(() => {
        fetchData();
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pipelineRunning, fetchData]);

  const fetchBandRooms = async () => {
    setFetchingRooms(true);
    setBandError(null);
    try {
      const res = await fetch('/api/band/rooms');
      const json = await res.json();
      if (json.error) {
        setBandError(json.error);
      } else {
        setBandRooms(json.rooms || []);
      }
    } catch (err: any) {
      setBandError(err.message);
    } finally {
      setFetchingRooms(false);
    }
  };

  const handleCreateBandRoom = async () => {
    setLinking(true);
    setBandError(null);
    try {
      const res = await fetch('/api/band/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId, action: 'CREATE_ROOM' }),
      });
      const json = await res.json();
      if (json.error) {
        setBandError(json.error);
      } else {
        await fetchData();
        await fetchBandRooms();
      }
    } catch (err: any) {
      setBandError(err.message);
    } finally {
      setLinking(false);
    }
  };

  const handleLinkBandRoom = async (roomId: string) => {
    if (!roomId) return;
    setLinking(true);
    setBandError(null);
    try {
      const res = await fetch('/api/band/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId, action: 'LINK_ROOM', roomId }),
      });
      const json = await res.json();
      if (json.error) {
        setBandError(json.error);
      } else {
        await fetchData();
        await fetchBandRooms();
      }
    } catch (err: any) {
      setBandError(err.message);
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkBandRoom = async () => {
    setLinking(true);
    setBandError(null);
    try {
      const res = await fetch('/api/band/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId, action: 'UNLINK_ROOM' }),
      });
      const json = await res.json();
      if (json.error) {
        setBandError(json.error);
      } else {
        await fetchData();
        await fetchBandRooms();
      }
    } catch (err: any) {
      setBandError(err.message);
    } finally {
      setLinking(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!trial?.band_room_id) return;
    setTestSending(true);
    try {
      const res = await fetch('/api/band/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trialId,
          action: 'SEND_MESSAGE',
          roomId: trial.band_room_id,
          sender: 'Decision Orchestrator',
          message: '⚡ Manual connectivity test: Connection to TrialSync is active and validated.'
        }),
      });
      const json = await res.json();
      if (json.error) {
        alert(`Test failed: ${json.error}`);
      } else {
        alert('Connectivity test message sent successfully!');
      }
    } catch (err: any) {
      alert(`Error sending test: ${err.message}`);
    } finally {
      setTestSending(false);
    }
  };

  const handleStartEditProtocol = () => {
    if (!protocol) return;
    setEditedProtocolTitle(protocol.sections_json.title || '');
    setEditedInclusionCriteria((protocol.sections_json.inclusion_criteria || []).join('\n'));
    setEditedExclusionCriteria((protocol.sections_json.exclusion_criteria || []).join('\n'));
    setEditedPrimaryEndpoint(protocol.sections_json.primary_endpoint || '');
    setEditedAssumptions((protocol.sections_json.assumptions || []).join('\n'));
    setIsEditingProtocol(true);
  };

  const handleSaveProtocol = async () => {
    try {
      const res = await fetch('/api/trials/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trialId,
          type: 'PROTOCOL',
          sectionsJson: {
            title: editedProtocolTitle,
            inclusion_criteria: editedInclusionCriteria.split('\n').map(c => c.trim()).filter(Boolean),
            exclusion_criteria: editedExclusionCriteria.split('\n').map(c => c.trim()).filter(Boolean),
            primary_endpoint: editedPrimaryEndpoint,
            assumptions: editedAssumptions.split('\n').map(a => a.trim()).filter(Boolean)
          }
        })
      });
      if (res.ok) {
        setIsEditingProtocol(false);
        await fetchData();
      }
    } catch (err) {
      console.error('Error saving protocol:', err);
    }
  };

  const handleStartEditSap = () => {
    if (!sap) return;
    setEditedAnalysisPopulation(sap.content_json.analysis_population || '');
    setEditedPrimaryStatisticalMethod(sap.content_json.primary_statistical_method || '');
    setEditedCalculatedSampleSize(sap.content_json.power_calculation?.calculated_sample_size || '');
    setEditedAssumedActiveEfficacy(sap.content_json.power_calculation?.assumed_active_efficacy || 0.65);
    setEditedAssumedPlaceboEfficacy(sap.content_json.power_calculation?.assumed_placebo_efficacy || 0.40);
    setEditedAlpha(sap.content_json.power_calculation?.alpha || 0.05);
    setEditedPower(sap.content_json.power_calculation?.power || 0.80);
    setEditedEndpointValidation(sap.content_json.endpoint_validation || '');
    setIsEditingSap(true);
  };

  const handleSaveSap = async () => {
    try {
      const res = await fetch('/api/trials/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trialId,
          type: 'SAP',
          contentJson: {
            analysis_population: editedAnalysisPopulation,
            primary_statistical_method: editedPrimaryStatisticalMethod,
            power_calculation: {
              assumed_active_efficacy: Number(editedAssumedActiveEfficacy),
              assumed_placebo_efficacy: Number(editedAssumedPlaceboEfficacy),
              alpha: Number(editedAlpha),
              power: Number(editedPower),
              calculated_sample_size: editedCalculatedSampleSize,
              formula: 'Two-sample chi-square comparison of proportions'
            },
            endpoint_validation: editedEndpointValidation,
            notes: sap.content_json.notes || []
          }
        })
      });
      if (res.ok) {
        setIsEditingSap(false);
        await fetchData();
      }
    } catch (err) {
      console.error('Error saving SAP:', err);
    }
  };

  const handlePubMedSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubMedQuery.trim() || pubMedSearching) return;
    setPubMedSearching(true);
    try {
      const res = await fetch('/api/pubmed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId, query: pubMedQuery })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPubMedQuery('');
        if (json.count > 0) {
          alert(`Successfully Ingested ${json.count} PubMed articles.`);
          await fetchData();
        } else {
          alert('No articles found matching that query.');
        }
      } else {
        alert(`PubMed Search failed: ${json.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Error searching PubMed: ${err.message}`);
    } finally {
      setPubMedSearching(false);
    }
  };

  const handleClinicalTrialsSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctCondition.trim() || ctSearching) return;
    setCtSearching(true);
    try {
      const res = await fetch('/api/clinicaltrials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId, condition: ctCondition })
      });
      const json = await res.json();
      if (res.ok) {
        setCtCondition('');
        alert(`Imported ${json.count} real clinical trial protocol templates from ClinicalTrials.gov.`);
        await fetchData();
      } else {
        alert(`ClinicalTrials.gov search failed: ${json.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setCtSearching(false);
    }
  };

  const handleFDASearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fdaDrugName.trim() || fdaSearching) return;
    setFdaSearching(true);
    try {
      const res = await fetch('/api/openfda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId, drugName: fdaDrugName })
      });
      const json = await res.json();
      if (res.ok) {
        setFdaDrugName('');
        const msg = json.hasBoxedWarning
          ? `⚠️ FDA ALERT: Black box warning detected! Imported ${json.count} FDA compliance documents.`
          : `Imported ${json.count} FDA compliance documents for "${fdaDrugName}".`;
        alert(msg);
        await fetchData();
      } else {
        alert(`openFDA search failed: ${json.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setFdaSearching(false);
    }
  };

  const handleResolveConflict = async (conflictId: string, option: 'ACCEPT_RECOMMENDATION' | 'IGNORE_CONFLICT' | 'OVERRIDE') => {
    try {
      const rationale = resolutionRationals[conflictId] || '';
      const res = await fetch('/api/conflicts/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictId,
          trialId,
          resolutionOption: option,
          customRationale: rationale
        }),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Conflict resolution failed:', err);
    }
  };

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoning((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const runPipeline = async () => {
    if (pipelineRunning) return;
    setPipelineRunning(true);
    setChatHistory([]); // Clear chat history to show fresh pipeline log

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const addMsg = (sender: string, role: string, content: string, type: ChatMessage['type'], reasoningPath?: any) => {
      setChatHistory(prev => [...prev, {
        id: `msg-${Date.now()}-${Math.random()}`,
        sender,
        role,
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type,
        reasoningPath
      }]);
    };

    const bandRoomId = trial?.band_room_id;
    const postToBand = async (agentName: string, eventType: string, content: string, recipients?: string, metadata?: any) => {
      // 1. Dispatch custom event locally so that client WebSocket listener registers it even if WebSocket is disconnected
      const newMsg = {
        id: `local-band-${Date.now()}-${Math.random()}`,
        type: eventType === 'message' ? 'message' : 'event',
        senderName: agentName,
        senderType: 'Agent',
        content,
        messageType: eventType,
        metadata,
        timestamp: new Date().toISOString()
      };
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('local-band-message', { detail: newMsg }));
      }

      if (!bandRoomId) return;
      try {
        await fetch('/api/band/pipeline-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trialId, roomId: bandRoomId, agentName, eventType, content, recipients, metadata }),
        });
      } catch {
        // Band posting is non-critical
      }
    };

    try {
      // Step 0: Orchestrator Start
      setCurrentPipelineAgent('orchestrator');
      addMsg('Decision Orchestrator', 'Lead Orchestrator', 'Initiating multi-agent protocol design and verification pipeline...', 'thought');
      postToBand('Decision Orchestrator', 'thought', 'Initiating multi-agent protocol design and verification pipeline for trial ' + trialId);
      await sleep(1200);

      // Step 1: Literature Scout
      setCurrentPipelineAgent('scout');
      addMsg('Literature Scout', 'AI Specialist', 'Scanning ingested references for efficacy rates, dosage, and safety parameters...', 'chat');
      postToBand('Literature Scout', 'thought', 'Scanning ingested references for efficacy rates, dosage, and safety parameters...');
      await sleep(1500);

      let res = await fetch(`/api/agents/scout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId }),
      });
      let json = res.ok ? await res.json() : null;
      if (!res.ok || !json) throw new Error(json?.error || 'Literature Scout failed to synthesize evidence.');

      postToBand('Literature Scout', 'tool_call', "PubMed search for safety signals in Crohn's disease literature", undefined, { action: 'extract_safety_signals', parameters: 'ALT, eGFR, adverse_events' });
      addMsg('Literature Scout', 'AI Specialist', `Evidence synthesis complete. Extracted ${json.evidenceBrief.safety_signals.length} safety signals and ${json.evidenceBrief.efficacy.length} efficacy endpoints.`, 'chat', {
        thought: "Analyze Crohn's Indication literature (Smith et al., Johnson et al.) for safety limits.",
        action: 'Extracted key safety parameters: baseline ALT (>40 U/L) and renal eGFR (<60 mL/min).',
        observation: 'Discovered high hepatotoxicity and renal impairment risk points.',
        decision: 'Build structured Evidence Brief and pass safety thresholds to Protocol Designer.'
      });
      postToBand('Literature Scout', 'message', `Evidence Brief ready. ${json.evidenceBrief.safety_signals.length} safety signals, ${json.evidenceBrief.efficacy.length} efficacy endpoints extracted. Safety thresholds: ALT ≤ 40 U/L, eGFR ≥ 60 mL/min.`, 'Protocol Designer');
      await fetchData();
      await sleep(1200);

      // Step 2: Protocol Designer
      setCurrentPipelineAgent('designer');
      addMsg('Protocol Designer', 'AI Specialist', `Drafting study protocol...`, 'chat');
      postToBand('Protocol Designer', 'thought', `Drafting study protocol based on Literature Scout evidence brief...`);
      await sleep(1500);

      res = await fetch(`/api/agents/designer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId, introduceConflict }),
      });
      json = res.ok ? await res.json() : null;
      if (!res.ok || !json) throw new Error(json?.error || 'Protocol Designer failed to draft protocol.');

      postToBand('Protocol Designer', 'tool_call', 'Generate protocol sections with inclusion/exclusion criteria aligned to evidence', undefined, { action: 'compile_protocol', conflict_mode: introduceConflict });
      addMsg('Protocol Designer', 'AI Specialist', `Protocol draft v1.0 compiled: "${json.protocol.title}" with inclusion/exclusion filters.`, 'chat', {
        thought: "Formulate protocol sections aligned with Crohn's disease evidence.",
        action: `Generate exclusion parameters. ${introduceConflict ? 'Simulating Design Flaws: Set ALT exclusion to >100 U/L and primary endpoint to Week 8' : 'Align boundaries: ALT <= 40 U/L and primary endpoint Week 12'}.`,
        observation: 'Document structure created and saved in workspace.',
        decision: 'Notify Statistical Analyst for sample size powering.'
      });
      postToBand('Protocol Designer', 'message', `Protocol v1.0 drafted. ${json.protocol.inclusion_criteria?.length || 0} inclusion rules, ${json.protocol.exclusion_criteria?.length || 0} exclusion rules. Primary endpoint: ${json.protocol.primary_endpoint || 'defined'}.`, 'Regulatory Auditor');
      await fetchData();
      await sleep(1200);

      // Step 3: Statistical Analyst
      setCurrentPipelineAgent('statistical');
      addMsg('Statistical Analyst', 'AI Specialist', 'Calculating sample size and power calculations based on Literature Scout response rates...', 'chat');
      postToBand('Statistical Analyst', 'thought', 'Calculating sample size and power using chi-square test for remission proportions...');
      await sleep(1500);

      res = await fetch(`/api/agents/statistical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId }),
      });
      json = res.ok ? await res.json() : null;
      if (!res.ok || !json) throw new Error(json?.error || 'Statistical Analyst failed power calculations.');

      const sampleSize = json.sap.power_calculation.calculated_sample_size;
      postToBand('Statistical Analyst', 'tool_result', `Power calculation complete: ${json.sap.power_calculation.power * 100}% power, ${sampleSize} sample size required. Endpoint: ${json.sap.endpoint_validation}`, undefined, { power: json.sap.power_calculation.power, sample_size: sampleSize });
      addMsg('Statistical Analyst', 'AI Specialist', `SAP v1.0 created. Calculated sample size: ${sampleSize}. Endpoint justification: "${json.sap.endpoint_validation.substring(0, 70)}..."`, 'chat', {
        thought: 'Read Protocol primary endpoint and literature peak efficacy duration.',
        action: "Calculate Chi-square test power for Crohn's remission proportions.",
        observation: `Sample size powered at ${json.sap.power_calculation.power * 100}% requiring ${sampleSize}. Endpoint timing check: ${json.sap.endpoint_validation}`,
        decision: 'Submit Statistical Analysis Plan and lock gate for Regulatory Review.'
      });
      postToBand('Statistical Analyst', 'message', `SAP v1.0: ${sampleSize} sample size at ${json.sap.power_calculation.power * 100}% power. ${json.sap.endpoint_validation}`, 'Regulatory Auditor');
      await fetchData();
      await sleep(1200);

      // Step 4: Regulatory Agent
      setCurrentPipelineAgent('reviewer');
      addMsg('Regulatory Agent', 'AI Specialist', 'Auditing design parameters against evidence safety bounds and biostatistics...', 'chat');
      postToBand('Regulatory Auditor', 'thought', 'Cross-referencing protocol parameters against evidence safety thresholds and statistical validity...');
      await sleep(1500);

      res = await fetch(`/api/agents/reviewer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId }),
      });
      json = res.ok ? await res.json() : null;
      if (!res.ok || !json) throw new Error(json?.error || 'Regulatory compliance review failed.');

      if (json.status === 'CONFLICT_DETECTED') {
        postToBand('Regulatory Auditor', 'tool_result', `Audit complete: ${json.conflicts.length} conflicts detected between evidence and protocol design`, undefined, { conflict_count: json.conflicts.length, status: 'CONFLICT_DETECTED' });
        addMsg('Regulatory Agent', 'AI Specialist', `Compliance review complete. Status: CONFLICT_DETECTED. Identified ${json.conflicts.length} design discrepancies. Surfaced to Conflicts Hub.`, 'error', {
          thought: 'Run compliance checks for liver limits, kidney filters, and endpoint durations.',
          action: 'Scan Protocol exclusion array for ALT and eGFR values. Inspect primary endpoint week.',
          observation: `Detected ${json.conflicts.length} critical variances between evidence and protocol draft.`,
          decision: 'Lock gate. Halt FDA IND workflow and request lead clinician resolution.'
        });
        postToBand('Regulatory Auditor', 'task', `CONFLICT_DETECTED: ${json.conflicts.map((c: any) => c.id).join(', ')}. Human review required.`, 'Decision Orchestrator');
      } else {
        postToBand('Regulatory Auditor', 'tool_result', 'Audit complete: All parameters aligned. No compliance gaps.', undefined, { status: 'APPROVED' });
        addMsg('Regulatory Agent', 'AI Specialist', 'Compliance review complete. Status: APPROVED. Protocol design aligns perfectly with safety guidelines and statistical power.', 'success', {
          thought: 'Review protocol exclusions and statistical plans.',
          action: 'Verify ALT <= 40 U/L, eGFR >= 60, and primary endpoint Week 12.',
          observation: 'All protocol parameters match evidence safety bounds. Power is stable.',
          decision: 'Unlock gate. Clear protocol for FDA IND submission.'
        });
        postToBand('Regulatory Auditor', 'message', '✅ APPROVED: Protocol design aligns with safety guidelines and statistical power. No conflicts.', 'Decision Orchestrator');
      }

      setCurrentPipelineAgent('orchestrator');
      addMsg('Decision Orchestrator', 'Lead Orchestrator', 'Multi-agent design loop finished successfully.', 'thought');
      postToBand('Decision Orchestrator', 'message', 'Multi-agent design loop completed. Ready for review.');
      await fetchData();
    } catch (err: any) {
      addMsg('Decision Orchestrator', 'Lead Orchestrator', `Pipeline execution aborted: ${err.message}`, 'error');
      postToBand('Decision Orchestrator', 'error', `Pipeline aborted: ${err.message}`);
    } finally {
      setPipelineRunning(false);
      setCurrentPipelineAgent(null);
    }
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || pipelineRunning) return;

    const cmd = chatInput.trim();
    setChatInput('');

    // Add user message to history
    setChatHistory((prev) => [...prev, {
      id: `usr-${Date.now()}`,
      sender: 'Human Lead',
      role: 'Lead Clinician',
      content: cmd,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'command'
    }]);

    const lowerCmd = cmd.toLowerCase();

    // 1. Slash command parser
    if (lowerCmd.startsWith('/sync') || lowerCmd.startsWith('/run')) {
      await runPipeline();
      return;
    }

    if (lowerCmd.startsWith('/help')) {
      setChatHistory((prev) => [...prev, {
        id: `sys-${Date.now()}`,
        sender: 'System',
        role: 'Help Console',
        content: `TrialSync Command Panel - Available Commands:
        - "/sync" or "/run" : Triggers the multi-agent design loop.
        - "/fix all" : Resolves all open conflicts automatically and triggers re-sync.
        - "/fix alt" : Resolves ALT limits conflict and re-syncs.
        - "/fix renal" : Resolves eGFR renal conflict and re-syncs.
        - "/fix endpoint" : Resolves primary endpoint week conflict and re-syncs.
        - Ask any question : Directly query the Decision Orchestrator about the trial parameters.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'system'
      }]);
      return;
    }

    if (lowerCmd.startsWith('/fix') || lowerCmd.startsWith('/accept')) {
      let target = '';
      if (lowerCmd.includes('alt') || lowerCmd.includes('liver')) target = 'ALT';
      else if (lowerCmd.includes('renal') || lowerCmd.includes('egfr') || lowerCmd.includes('kidney')) target = 'RENAL';
      else if (lowerCmd.includes('endpoint') || lowerCmd.includes('week')) target = 'ENDPOINT';
      else if (lowerCmd.includes('all')) target = 'ALL';

      if (!target) {
        setChatHistory((prev) => [...prev, {
          id: `sys-err-${Date.now()}`,
          sender: 'System',
          role: 'Command Error',
          content: 'Unrecognized resolution target. Specify: "/fix alt", "/fix renal", "/fix endpoint", or "/fix all".',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'error'
        }]);
        return;
      }

      setChatHistory((prev) => [...prev, {
        id: `sys-prg-${Date.now()}`,
        sender: 'System',
        role: 'Command Execution',
        content: `Resolving conflict(s) for target: ${target}...`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'system'
      }]);

      try {
        const activeConflicts = conflicts.filter((c: any) => c.status === 'OPEN');
        let resolvedAny = false;

        for (const conf of activeConflicts) {
          const isMatch = target === 'ALL' || 
            (target === 'ALT' && conf.id.includes('ALT')) ||
            (target === 'RENAL' && conf.id.includes('RENAL')) ||
            (target === 'ENDPOINT' && conf.id.includes('ENDPOINT'));

          if (isMatch) {
            await fetch('/api/conflicts/resolve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                conflictId: conf.id,
                trialId,
                resolutionOption: 'ACCEPT_RECOMMENDATION',
                customRationale: 'Accepted recommended safety modifications from auditor.'
              }),
            });
            resolvedAny = true;
          }
        }

        if (resolvedAny) {
          setChatHistory((prev) => [...prev, {
            id: `sys-ok-${Date.now()}`,
            sender: 'System',
            role: 'Success',
            content: `Conflict resolved. Versioning bumped. Re-triggering multi-agent protocol sync...`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'success'
          }]);
          await fetchData();
          await runPipeline();
        } else {
          setChatHistory((prev) => [...prev, {
            id: `sys-warn-${Date.now()}`,
            sender: 'System',
            role: 'Warning',
            content: `No matching open conflicts found for target: ${target}.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'system'
          }]);
        }
      } catch (err: any) {
        setChatHistory((prev) => [...prev, {
          id: `sys-err-${Date.now()}`,
          sender: 'System',
          role: 'Error',
          content: `Failed to resolve conflict: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'error'
        }]);
      }
      return;
    }

    // Custom natural language chat fallback to API
    setChatHistory((prev) => [...prev, {
      id: `orch-typ-${Date.now()}`,
      sender: 'Decision Orchestrator',
      role: 'Lead Orchestrator',
      content: 'Typing...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'chat',
      status: 'typing'
    }]);

    try {
      const chatRes = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId, message: cmd }),
      });
      const chatJson = await chatRes.json();
      
      let content = chatJson.response;
      if (!content) {
        if (chatJson.error) {
          content = `⚠️ ${chatJson.error}\n\nHere's what I know:\n• Trial: ${data?.trial?.name || trialId}\n• Status: ${data?.trial?.status || 'Unknown'}\n• Open conflicts: ${conflicts.filter((c: any) => c.status === 'OPEN').length}\n• Documents: ${data?.documents?.length || 0}\n\nTry typing /help to see available commands.`;
        } else {
          content = 'Ready to help. Type /help for commands.';
        }
      }
      
      setChatHistory((prev) => {
        const filtered = prev.filter((m) => m.content !== 'Typing...');
        return [...filtered, {
          id: `orch-res-${Date.now()}`,
          sender: 'Decision Orchestrator',
          role: 'Lead Orchestrator',
          content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: chatJson.error ? 'error' : 'chat'
        }];
      });
    } catch (err: any) {
      const errorMsg = err.message || 'Chat service unavailable';
      setChatHistory((prev) => {
        const filtered = prev.filter((m) => m.content !== 'Typing...');
        return [...filtered, {
          id: `orch-err-${Date.now()}`,
          sender: 'Workspace Assistant',
          role: 'Lead Orchestrator',
          content: `**Trial Context:**\n• ${data?.trial?.name || trialId}\n• Status: ${data?.trial?.status || 'Unknown'}\n• ${conflicts.filter((c: any) => c.status === 'OPEN').length} open conflicts\n• ${data?.documents?.length || 0} documents\n\n> Chat service offline: ${errorMsg}\nTry /sync to run the pipeline, or /fix to resolve conflicts.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'error'
        }];
      });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('trialId', trialId);
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        await fetchData();
        // Trigger automated sync on document upload
        await runPipeline();
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
    }
  };
  // Auto-seed documents and start agent pipeline automatically on initial empty load
  useEffect(() => {
    if (data && data.trial && data.trial.status === 'INITIAL' && (!data.documents || data.documents.length === 0) && !pipelineRunning) {
      console.log('Auto-seeding new trial workspace...');
      const seedIndication = data.trial.indication || "Crohn's Disease";
      
      const seedWorkspace = async () => {
        try {
          const pubmedRes = await fetch('/api/pubmed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trialId, query: seedIndication })
          });
          
          if (pubmedRes.ok) {
            const pubmedJson = await pubmedRes.json();
            if (pubmedJson.success && pubmedJson.count > 0) {
              await fetchData();
              runPipeline();
            }
          }
        } catch (e) {
          console.error('Auto-seeding failed:', e);
        }
      };
      
      seedWorkspace();
    }
  }, [data, trialId, fetchData, pipelineRunning]);

  return (
    <TrialContext.Provider value={{
      trialId,
      data,
      loading,
      fetchData,
      introduceConflict,
      setIntroduceConflict,
      pipelineRunning,
      setPipelineRunning,
      chatHistory,
      setChatHistory,
      currentPipelineAgent,
      setCurrentPipelineAgent,
      wsUrl,
      setWsUrl,
      runPipeline,
      inspectorAgent,
      setInspectorAgent,
      
      // Search
      pubMedQuery,
      setPubMedQuery,
      pubMedSearching,
      handlePubMedSearch,
      ctCondition,
      setCtCondition,
      ctSearching,
      handleClinicalTrialsSearch,
      fdaDrugName,
      setFdaDrugName,
      fdaSearching,
      handleFDASearch,

      // Protocol edits
      isEditingProtocol,
      setIsEditingProtocol,
      editedProtocolTitle,
      setEditedProtocolTitle,
      editedInclusionCriteria,
      setEditedInclusionCriteria,
      editedExclusionCriteria,
      setEditedExclusionCriteria,
      editedPrimaryEndpoint,
      setEditedPrimaryEndpoint,
      editedAssumptions,
      setEditedAssumptions,
      handleStartEditProtocol,
      handleSaveProtocol,

      // SAP edits
      isEditingSap,
      setIsEditingSap,
      editedAnalysisPopulation,
      setEditedAnalysisPopulation,
      editedPrimaryStatisticalMethod,
      setEditedPrimaryStatisticalMethod,
      editedCalculatedSampleSize,
      setEditedCalculatedSampleSize,
      editedAssumedActiveEfficacy,
      setEditedAssumedActiveEfficacy,
      editedAssumedPlaceboEfficacy,
      setEditedAssumedPlaceboEfficacy,
      editedAlpha,
      setEditedAlpha,
      editedPower,
      setEditedPower,
      editedEndpointValidation,
      setEditedEndpointValidation,
      handleStartEditSap,
      handleSaveSap,

      // Conflicts
      resolutionRationals,
      setResolutionRationals,
      handleResolveConflict,

      // Chat console UI
      chatInput,
      setChatInput,
      expandedReasoning,
      setExpandedReasoning,
      toggleReasoning,
      isChatMaximized,
      setIsChatMaximized,
      handleSendCommand,

      // Band room actions
      bandRooms,
      fetchingRooms,
      selectedRoomId,
      setSelectedRoomId,
      bandError,
      linking,
      testSending,
      fetchBandRooms,
      handleCreateBandRoom,
      handleLinkBandRoom,
      handleUnlinkBandRoom,
      handleSendTestMessage,
      agentKeys,
      setAgentKeys,

      // WebSockets
      liveBandMessages,
      bandConnected,
      bandWsError,

      // Uploads
      uploading,
      handleUpload,
    }}>
      {children}
    </TrialContext.Provider>
  );
}
