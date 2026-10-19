import { Router, Request, Response } from 'express';
import { modelManager } from '../ml/modelManager';
import { dbStore } from '../db/store';
import { supabaseService } from '../db/supabase';
import { serpApiService } from '../services/serpApiService';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', async (_req: Request, res: Response) => {
  let microserviceOnline = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 600);
    const resp = await fetch('http://127.0.0.1:8000/health', { signal: controller.signal });
    clearTimeout(timeout);
    microserviceOnline = resp.ok;
  } catch {}

  const dbStatus = await supabaseService.getStatus();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    activeModel: modelManager.getConfig().name,
    backendType: modelManager.getConfig().backendType,
    microserviceOnline,
    database: {
      provider: dbStatus.provider,
      isConfigured: dbStatus.isConfigured,
      isConnected: dbStatus.isConnected,
    },
  });
});

// Database Health & Sync Status
apiRouter.get('/db/status', async (_req: Request, res: Response) => {
  try {
    const status = await supabaseService.getStatus();
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Seed / Synchronize Local Data to Supabase
apiRouter.post('/db/sync-seed', async (_req: Request, res: Response) => {
  try {
    const result = await supabaseService.seedToSupabase();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Platform Statistics
apiRouter.get('/stats', async (_req: Request, res: Response) => {
  const stats = dbStore.getStats();
  const dbStatus = await supabaseService.getStatus();

  res.json({
    success: true,
    data: {
      ...stats,
      databaseProvider: dbStatus.provider,
      databaseConnected: dbStatus.isConnected,
      hasTables: dbStatus.hasTables,
    },
  });
});

// ML Model Information & Architecture Specs
apiRouter.get('/model/info', async (_req: Request, res: Response) => {
  let microserviceOnline = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 600);
    const resp = await fetch('http://127.0.0.1:8000/health', { signal: controller.signal });
    clearTimeout(timeout);
    microserviceOnline = resp.ok;
  } catch {}

  res.json({
    success: true,
    data: {
      ...modelManager.getConfig(),
      microserviceOnline,
    },
  });
});

// Configure ML Model
const handleModelConfigure = (req: Request, res: Response) => {
  try {
    const updated = modelManager.updateConfig(req.body);
    res.json({
      success: true,
      message: 'ML Model configuration updated successfully',
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

apiRouter.post('/model/configure', handleModelConfigure);
apiRouter.post('/model/config', handleModelConfigure);

// ML Inference Endpoint
apiRouter.post('/classify', async (req: Request, res: Response) => {
  try {
    const { imageBase64, userHint, presetId, mimeType } = req.body;
    if (!imageBase64 && !presetId) {
      return res.status(400).json({ error: 'imageBase64 or presetId parameter is required' });
    }

    const output = await modelManager.classifyImage(imageBase64 || '', {
      userHint,
      presetId,
      mimeType,
    });

    // Automatically log user activity
    supabaseService.logActivity({
      action: 'ai_classify',
      targetName: output.result.primaryLabel,
      details: {
        category: output.result.primaryCategory,
        confidence: output.result.confidence,
        engine: output.engineUsed,
      },
    }).catch(() => {});

    res.json({
      success: true,
      source: output.engineUsed,
      latencyMs: output.latencyMs,
      featureEmbeddingPreview: output.featureEmbeddingPreview,
      data: output.result,
    });
  } catch (err: any) {
    console.error('Classification endpoint error:', err);
    res.status(500).json({ error: err.message || 'Classification inference failed' });
  }
});

// ==========================================
// User Searches Tracking Endpoints
// ==========================================
apiRouter.post('/searches', async (req: Request, res: Response) => {
  try {
    const { query, category, statusFilter, featureFilter, resultsCount, source, sessionId } = req.body;
    if (!query && !category && !statusFilter && !featureFilter) {
      return res.status(400).json({ error: 'Search parameters missing' });
    }

    const searchLog = await supabaseService.logSearch({
      sessionId: sessionId || req.headers['x-session-id']?.toString() || '',
      query: (query || '').trim(),
      category: category || 'all',
      statusFilter: statusFilter || 'all',
      featureFilter: featureFilter || 'all',
      resultsCount: typeof resultsCount === 'number' ? resultsCount : 0,
      source: source || 'discovery_bar',
    });

    res.status(201).json({ success: true, data: searchLog });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/searches', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const searches = await supabaseService.getAllSearches(limit);
    res.json({ success: true, count: searches.length, data: searches });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/searches/analytics', async (_req: Request, res: Response) => {
  try {
    const analytics = await supabaseService.getSearchAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// User Activities Audit Endpoints
// ==========================================
apiRouter.post('/activities', async (req: Request, res: Response) => {
  try {
    const { action, targetId, targetName, details, sessionId } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'Action parameter is required' });
    }

    const activity = await supabaseService.logActivity({
      sessionId: sessionId || req.headers['x-session-id']?.toString() || '',
      action,
      targetId,
      targetName,
      details,
    });

    res.status(201).json({ success: true, data: activity });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/activities', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const activities = await supabaseService.getAllActivities(limit);
    res.json({ success: true, count: activities.length, data: activities });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Places Endpoints (Connected with Supabase)
// ==========================================
apiRouter.get('/places', async (req: Request, res: Response) => {
  try {
    const { category, accessibilityLevel, query } = req.query;
    const places = await supabaseService.getAllPlaces({
      category: category as string,
      accessibilityLevel: accessibilityLevel as string,
      query: query as string,
    });
    res.json({ success: true, count: places.length, data: places });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/places/:id', async (req: Request, res: Response) => {
  try {
    const place = await supabaseService.getPlaceById(req.params.id);
    if (!place) {
      return res.status(404).json({ error: 'Place not found' });
    }
    const reports = await supabaseService.getAllReports({ placeId: place.id });
    res.json({ success: true, data: { ...place, reports } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/places', async (req: Request, res: Response) => {
  try {
    const newPlace = await supabaseService.addPlace(req.body);
    res.status(201).json({ success: true, data: newPlace });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Admin Places Management Endpoints
apiRouter.put('/places/:id', async (req: Request, res: Response) => {
  try {
    const updated = await supabaseService.updatePlace(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Place not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/places/:id', async (req: Request, res: Response) => {
  try {
    const success = await supabaseService.deletePlace(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Place not found' });
    }
    res.json({ success: true, message: 'Place deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/places/:id/verify', async (req: Request, res: Response) => {
  try {
    const updated = await supabaseService.toggleVerifyPlace(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Place not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================================
// Community Reports Endpoints (Connected with Supabase)
// ===================================================
apiRouter.get('/reports', async (req: Request, res: Response) => {
  try {
    const { placeId, featureCategory } = req.query;
    const reports = await supabaseService.getAllReports({
      placeId: placeId as string,
      featureCategory: featureCategory as string,
    });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/reports', async (req: Request, res: Response) => {
  try {
    const newReport = await supabaseService.addReport(req.body);
    res.status(201).json({ success: true, data: newReport });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/reports/:id/upvote', async (req: Request, res: Response) => {
  try {
    const updated = await supabaseService.upvoteReport(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Community Reports Moderation Endpoints
apiRouter.put('/reports/:id', async (req: Request, res: Response) => {
  try {
    const updated = await supabaseService.updateReport(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/reports/:id', async (req: Request, res: Response) => {
  try {
    const success = await supabaseService.deleteReport(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/reports/:id/verify', async (req: Request, res: Response) => {
  try {
    const updated = await supabaseService.toggleVerifyReport(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Reset Data Store
apiRouter.post('/admin/reset', (_req: Request, res: Response) => {
  dbStore.resetToDefaults();
  res.json({
    success: true,
    message: 'Data store reset to initial seed data',
    stats: dbStore.getStats(),
  });
});

// ===================================================
// SerpApi Google Maps Engine Endpoints
// ===================================================
apiRouter.get('/serpapi/status', (req: Request, res: Response) => {
  const customKey = req.query.apiKey as string | undefined;
  const isConfigured = serpApiService.isConfigured(customKey);
  res.json({
    success: true,
    isConfigured,
    message: isConfigured
      ? 'SerpApi Google Maps Engine is active and ready for live global searches'
      : 'SerpApi key not set. Using curated Google Maps realistic fallback (set SERPAPI_KEY in .env or map bar).',
  });
});

apiRouter.get('/serpapi/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || 'accessible places';
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const zoom = req.query.zoom ? parseInt(req.query.zoom as string) : undefined;
    const apiKey = (req.query.apiKey as string) || undefined;

    const result = await serpApiService.searchGoogleMaps({
      query,
      lat,
      lng,
      zoom,
      apiKey,
    });

    // Also log this search in Supabase / User Searches!
    supabaseService.logSearch({
      query: `[Google Maps via SerpApi] ${query}`,
      category: 'all',
      statusFilter: 'all',
      featureFilter: 'all',
      resultsCount: result.totalResults,
      source: 'map_search',
    }).catch(() => {});

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Import a venue discovered via SerpApi into Supabase database
apiRouter.post('/serpapi/import', async (req: Request, res: Response) => {
  try {
    const placeData = req.body;
    if (!placeData || !placeData.name) {
      return res.status(400).json({ error: 'Valid venue data is required' });
    }

    const savedPlace = await supabaseService.addPlace(placeData);
    res.status(201).json({
      success: true,
      message: `"${savedPlace.name}" successfully imported from Google Maps into Supabase!`,
      data: savedPlace,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
