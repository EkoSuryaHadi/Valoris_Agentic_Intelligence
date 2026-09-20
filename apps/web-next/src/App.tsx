import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createApiClient } from './api/client';
import { Shell } from './components/layout/Shell';
import type { UserContext, UserRole, ProjectSummary } from './types/auth';

// Screens
import { Executive } from './screens/Executive';
import { Overview } from './screens/Overview';
import { Structure } from './screens/Structure';
import { BaselineScreen } from './screens/Baseline';
import { Imports } from './screens/Imports';
import { Transactions } from './screens/Transactions';
import { ForecastScreen } from './screens/Forecast';
import { EvmScreen } from './screens/Evm';
import { Changes } from './screens/Changes';
import { CashFlowScreen } from './screens/CashFlow';
import { RisksScreen } from './screens/Risks';
import { AgentCenter } from './screens/AgentCenter';
import { Reports } from './screens/Reports';
import { Audit } from './screens/Audit';

export const App: React.FC = () => {
  // Navigation
  const [currentHash, setCurrentHash] = useState<string>(() => window.location.hash || '#executive');

  // User Context & Active Project
  const [userContext, setUserContext] = useState<UserContext>({
    userId: '00000000-0000-0000-0000-000000000010',
    organizationId: '00000000-0000-0000-0000-000000000001',
    projectId: '00000000-0000-0000-0000-000000000100',
    role: 'executive',
    name: 'Aditya Pratama (Chief Project Controls Officer)'
  });

  const [projects, setProjects] = useState<ProjectSummary[]>([
    {
      id: '00000000-0000-0000-0000-000000000100',
      code: 'PRJ-ALPHA',
      name: 'Northstar Industrial Refinery & Cryogenic Expansion'
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFindingsCount, setActiveFindingsCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync window hash
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#executive');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((hash: string) => {
    window.location.hash = hash;
    setCurrentHash(hash);
  }, []);

  // API Client with current user context
  const api = useMemo(
    () =>
      createApiClient({
        baseUrl: import.meta.env.VITE_API_BASE_URL || '',
        getUserContext: () => userContext
      }),
    [userContext]
  );

  // Load project list and findings summary
  const loadInitialState = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [projRes, findRes] = await Promise.allSettled([
        api.listProjects(),
        api.getAgentFindings(userContext.projectId)
      ]);

      if (projRes.status === 'fulfilled' && projRes.value?.data?.length) {
        const loadedProjects = projRes.value.data;
        setProjects(loadedProjects);
        if (!loadedProjects.some((p) => p.id === userContext.projectId)) {
          setUserContext((prev) => ({ ...prev, projectId: loadedProjects[0].id }));
        }
      }
      if (findRes.status === 'fulfilled' && findRes.value?.data) {
        const activeStatuses = ['new', 'active', 'open'];
        const active = findRes.value.data.filter((f) => !f.status || activeStatuses.includes((f.status || '').toLowerCase()));
        setActiveFindingsCount(active.length);
      }
    } catch {
      // Graceful fallback to initial seed state
    } finally {
      setIsRefreshing(false);
    }
  }, [api, userContext.projectId]);

  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);

  const handleProjectChange = (projectId: string) => {
    setUserContext((prev) => ({ ...prev, projectId }));
    setToastMessage(`Switched project workspace to ${projectId}`);
  };

  const handleRoleChange = (role: UserRole) => {
    setUserContext((prev) => ({ ...prev, role }));
    setToastMessage(`Switched operational role to ${role.toUpperCase()}`);
  };

  // Screen Dispatcher
  const renderScreen = () => {
    const route = currentHash.replace(/^#/, '');
    switch (route) {
      case 'executive':
        return <Executive api={api} projectId={userContext.projectId} onNavigate={navigate} />;
      case 'overview':
        return <Overview api={api} projectId={userContext.projectId} onNavigate={navigate} />;
      case 'structure':
        return <Structure api={api} projectId={userContext.projectId} />;
      case 'baseline':
        return <BaselineScreen api={api} projectId={userContext.projectId} />;
      case 'imports':
        return <Imports api={api} projectId={userContext.projectId} />;
      case 'transactions':
        return <Transactions api={api} projectId={userContext.projectId} />;
      case 'forecast':
        return <ForecastScreen api={api} projectId={userContext.projectId} />;
      case 'evm':
        return <EvmScreen api={api} projectId={userContext.projectId} />;
      case 'changes':
        return <Changes api={api} projectId={userContext.projectId} />;
      case 'cashflow':
        return <CashFlowScreen api={api} projectId={userContext.projectId} />;
      case 'risks':
        return <RisksScreen api={api} projectId={userContext.projectId} />;
      case 'agents':
        return <AgentCenter api={api} projectId={userContext.projectId} />;
      case 'reports':
        return <Reports api={api} projectId={userContext.projectId} />;
      case 'audit':
        return <Audit api={api} projectId={userContext.projectId} />;
      default:
        return <Executive api={api} projectId={userContext.projectId} onNavigate={navigate} />;
    }
  };

  return (
    <Shell
      currentHash={currentHash}
      onNavigate={navigate}
      userContext={userContext}
      projects={projects}
      onProjectChange={handleProjectChange}
      onRoleChange={handleRoleChange}
      onRefresh={loadInitialState}
      isRefreshing={isRefreshing}
      activeFindingCount={activeFindingsCount}
      toastMessage={toastMessage}
      onDismissToast={() => setToastMessage(null)}
    >
      {renderScreen()}
    </Shell>
  );
};
