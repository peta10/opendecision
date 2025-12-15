import { NextRequest, NextResponse } from 'next/server';
import { defaultCriteria } from '@/ppm-tool/data/criteria';
import { getToolRating } from '@/ppm-tool/shared/utils/toolRating';
import type { Tool, Criterion } from '@/ppm-tool/shared/types';

// Dynamically import canvas only when needed at runtime
let createCanvas: any = null;

const getCanvasModule = async () => {
  if (createCanvas) return createCanvas;
  
  try {
    // Dynamic import to avoid build-time issues
    const canvasModule = await import('canvas');
    createCanvas = canvasModule.createCanvas;
    return createCanvas;
  } catch (error) {
    console.warn('Canvas module not available:', error);
    return null;
  }
};

// Chart colors - Blue and Green only for Gmail compatibility
const toolColors: [string, string][] = [
  ['rgba(37, 99, 235, 0.2)', 'rgba(37, 99, 235, 1)'],      // Blue
  ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 1)'],    // Green
];

const getToolColor = (index: number): [string, string] => {
  return toolColors[index % toolColors.length];
};

// Simple in-memory cache for generated charts
const chartCache = new Map<string, { buffer: Buffer; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds for faster testing

// Generate cache key from parameters
function generateCacheKey(params: any): string {
  const { toolName, scores, rankings, labels, toolIndex } = params;
  const criteriaIds = params.criteria?.map((c: any) => c.id).join(',') || '';
  return `${toolName}-${toolIndex}-${criteriaIds}-${scores.join(',')}-${rankings.join(',')}`;
}

// Get cached chart or generate new one
function getCachedChart(params: any, canvasCreate: any): Buffer {
  const cacheKey = generateCacheKey(params);
  const cached = chartCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('📋 Cache hit for chart:', params.toolName);
    return cached.buffer;
  }
  
  console.log('🔄 Cache miss, generating new chart for:', params.toolName);
  const buffer = generateRadarChart(params, canvasCreate);
  
  // Store in cache
  chartCache.set(cacheKey, {
    buffer,
    timestamp: Date.now()
  });
  
  // Clean up old cache entries (simple cleanup)
  if (chartCache.size > 100) {
    const oldestKey = chartCache.keys().next().value;
    if (oldestKey) {
      chartCache.delete(oldestKey);
    }
  }
  
  return buffer;
}

// Create a simple 1x1 transparent PNG for fallback
function createFallbackImage(): Buffer {
  // 1x1 transparent PNG in base64, converted to buffer
  const transparentPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  return Buffer.from(transparentPNG, 'base64');
}

// Parse URL parameters
function parseChartParams(searchParams: URLSearchParams) {
  try {
    const toolName = searchParams.get('tool') || '';
    const toolData = searchParams.get('toolData');
    const selectedCriteriaIds = searchParams.get('criteria')?.split(',') || [];
    const userRankingsString = searchParams.get('userRankings');
    const toolIndex = parseInt(searchParams.get('toolIndex') || '0');
    
    // Parse tool data if provided
    let tool: Tool | null = null;
    if (toolData) {
      try {
        tool = JSON.parse(decodeURIComponent(toolData));
      } catch (e) {
        console.error('Error parsing tool data:', e);
      }
    }
    
    // Use provided criteria or default to all criteria
    const criteria = selectedCriteriaIds.length > 0 
      ? defaultCriteria.filter(c => selectedCriteriaIds.includes(c.id))
      : defaultCriteria;
    
    // Get scores and rankings
    let scores: number[] = [];
    if (tool) {
      scores = criteria.map(c => getToolRating(tool, c));
    } else {
      // Fallback to dummy data for testing
      scores = criteria.map(() => Math.floor(Math.random() * 5) + 1);
    }
      
    // Parse user rankings if provided
    let rankings: number[] = [];
    if (userRankingsString) {
      try {
        rankings = userRankingsString.split(',').map(r => parseInt(r.trim())).filter(r => !isNaN(r));
      } catch (e) {
        console.error('Error parsing user rankings:', e);
      }
    }
    
    // Fallback to random rankings if parsing failed or no data provided
    if (rankings.length === 0 || rankings.length !== criteria.length) {
      rankings = criteria.map(() => Math.floor(Math.random() * 5) + 1);
    }
    
    const labels = criteria.map(c => c.name);

    console.log('📊 Parsed data:', {
      toolName,
      criteriaCount: criteria.length,
      scoresCount: scores.length,
      rankingsCount: rankings.length,
      labelsCount: labels.length
    });

    return {
      toolName,
      tool,
      criteria,
      scores,
      rankings,
      labels,
      toolIndex,
      isValid: scores.length > 0 && rankings.length > 0 && labels.length > 0
    };
  } catch (error) {
    console.error('Error parsing chart parameters:', error);
    return {
      toolName: 'Unknown',
      tool: null,
      criteria: defaultCriteria,
      scores: [],
      rankings: [],
      labels: [],
      toolIndex: 0,
      isValid: false
    };
  }
}

// Generate radar chart
function generateRadarChart(params: any, canvasCreate: any): Buffer {
      if (!canvasCreate) {
    console.log('Canvas not available, returning fallback image');
    return createFallbackImage();
  }
  
  console.log('🎨 Generating radar chart for:', params.toolName);

  try {
    const { toolName, scores, rankings, labels, toolIndex } = params;
    
    // Create larger canvas for more criteria
    const canvas = canvasCreate(400, 350);
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 350);
    
    // Chart settings - larger canvas and spacing for 7 criteria
    const centerX = 200;
    const centerY = 175;
    const radius = 80;
    const numPoints = labels.length;
    
    if (numPoints === 0) {
      return createFallbackImage();
    }
    
    // Draw grid lines (5 levels)
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    for (let level = 1; level <= 5; level++) {
      const levelRadius = (radius * level) / 5;
      ctx.beginPath();
      
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
        const x = centerX + Math.cos(angle) * levelRadius;
        const y = centerY + Math.sin(angle) * levelRadius;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }
    
    // Draw axis lines
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    // Draw user rankings (green dashed line)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    
    for (let i = 0; i <= numPoints; i++) {
      const pointIndex = i % numPoints;
      const value = rankings[pointIndex] || 0;
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const distance = (radius * value) / 5;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
    
    // Draw tool scores (solid colored line)
    const [fillColor, strokeColor] = getToolColor(toolIndex);
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    
    ctx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
      const pointIndex = i % numPoints;
      const value = scores[pointIndex] || 0;
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const distance = (radius * value) / 5;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw labels
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const labelRadius = radius + 50; // More space for labels
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;
      
      const label = labels[i] || '';
      const words = label.split(' ');
      
      // Adjust text alignment based on position to avoid overlaps
      if (x < centerX - 30) {
        ctx.textAlign = 'right';
      } else if (x > centerX + 30) {
        ctx.textAlign = 'left';
      } else {
        ctx.textAlign = 'center';
      }
      
      // Better text wrapping for readability with smaller font
      ctx.font = '11px Arial, sans-serif';
      
      if (words.length > 2) {
        // Split long labels into two lines
        const midPoint = Math.ceil(words.length / 2);
        const firstLine = words.slice(0, midPoint).join(' ');
        const secondLine = words.slice(midPoint).join(' ');
        ctx.fillText(firstLine, x, y - 7);
        ctx.fillText(secondLine, x, y + 7);
      } else if (words.length === 2 && words.join(' ').length > 12) {
        // Split two long words
        ctx.fillText(words[0], x, y - 7);
        ctx.fillText(words[1], x, y + 7);
      } else {
        ctx.fillText(label, x, y);
      }
      
      // Reset font for other elements
      ctx.font = 'bold 12px Arial, sans-serif';
    }
    
    // Draw title only if we have a real tool name (not test data or empty)
    if (toolName && 
        toolName.trim() !== '' && 
        toolName !== 'Test Tool' && 
        toolName !== 'Unknown Tool' &&
        !toolName.includes('Test') &&
        toolName.length > 2) {
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(toolName, centerX, 30);
    }
    
    // Draw legend
    const legendY = 330;
    
    // User rankings legend
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(80, legendY);
    ctx.lineTo(110, legendY);
    ctx.stroke();
    
    ctx.fillStyle = '#374151';
    ctx.font = '11px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Your Rankings', 115, legendY + 4);
    
    // Tool scores legend
    ctx.strokeStyle = strokeColor;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(220, legendY);
    ctx.lineTo(250, legendY);
    ctx.stroke();
    
    const displayName = (toolName && 
                        toolName.trim() !== '' && 
                        toolName !== 'Test Tool' && 
                        toolName !== 'Unknown Tool' &&
                        !toolName.includes('Test') &&
                        toolName.length > 2) 
      ? toolName 
      : 'Tool Scores';
    ctx.fillText(displayName, 255, legendY + 4);
    
    // Convert to PNG buffer
    return canvas.toBuffer('image/png');
    
  } catch (error) {
    console.error('Error generating radar chart:', error);
    return createFallbackImage();
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ params: string[] }> }
) {
  try {
    // Clear cache for testing
    chartCache.clear();
    console.log('🗑️ Cache cleared for fresh generation');
    
    const params = await context.params;
    console.log('📊 Chart request received:', params.params);
    
    const canvasCreate = await getCanvasModule();
    console.log('📊 Canvas available:', !!canvasCreate);
    
    const searchParams = request.nextUrl.searchParams;
    console.log('📊 Search params:', Object.fromEntries(searchParams.entries()));
    
    const chartParams = parseChartParams(searchParams);
    
    console.log('📊 Parsed chart params:', chartParams);
    
    if (!chartParams.isValid) {
      console.log('❌ Invalid chart parameters, returning fallback');
      const fallbackBuffer = createFallbackImage();
      
      return new NextResponse(new Uint8Array(fallbackBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Content-Length': fallbackBuffer.length.toString(),
        },
      });
    }
    
    // Generate chart (with caching)
    const chartBuffer = getCachedChart(chartParams, canvasCreate);
    
    console.log('✅ Chart generated successfully, size:', chartBuffer.length);
    
    return new NextResponse(new Uint8Array(chartBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Length': chartBuffer.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('❌ Chart generation error:', error);
    
    const fallbackBuffer = createFallbackImage();
    return new NextResponse(new Uint8Array(fallbackBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300', // Shorter cache for errors
        'Content-Length': fallbackBuffer.length.toString(),
      },
    });
  }
}
