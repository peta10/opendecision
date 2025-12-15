import * as React from 'react';
import { Tool, Criterion } from '@/ppm-tool/shared/types';

/**
 * PPM Report Email Template
 * 
 * NOTE: This component uses inline styles intentionally for email compatibility.
 * Email clients have limited CSS support and inline styles ensure consistent rendering
 * across Gmail, Outlook, Apple Mail, and other email clients.
 * 
 * Linter warnings about inline styles are expected and should be ignored for this file.
 * 
 * @eslint-disable-next-line no-inline-styles
 */

interface PPMReportEmailTemplateProps {
  userEmail: string;
  firstName?: string;
  lastName?: string;
  selectedTools: Tool[];
  selectedCriteria: Criterion[];
  topRecommendations: {
    tool: Tool;
    score: number;
    rank: number;
  }[];
  chartImageUrl?: string;
}

export function PPMReportEmailTemplate({
  userEmail,
  firstName,
  lastName,
  selectedTools,
  selectedCriteria,
  topRecommendations,
  chartImageUrl
}: PPMReportEmailTemplateProps) {
  const topTool = topRecommendations[0];
  
  return (
    <html>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Your PPM Tool Comparison Report</title>
      </head>
      <body style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: '1.6',
        color: '#333333',
        backgroundColor: '#f8fafc',
        margin: 0,
        padding: 0,
        width: '100%',
        minWidth: '100%',
        WebkitTextSizeAdjust: '100%',
        textSizeAdjust: '100%'
      }}>
        {/* Main Container */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '100%',
          border: '1px solid #e5e7eb'
        }}>
          
          {/* Header */}
          <div style={{
            backgroundColor: '#0057B7',
            padding: '30px 40px',
            textAlign: 'center' as const
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="https://panoramic-solutions.com/images/Logo_Panoramic_Solutions.webp" 
              alt="Panoramic Solutions" 
              style={{
                maxWidth: '200px',
                height: 'auto',
                marginBottom: '10px'
              }}
            />
            <h1 style={{
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '0',
              textAlign: 'center' as const
            }}>
              Your PPM Tool Analysis Results
            </h1>
          </div>

          {/* Content */}
          <div style={{ padding: '40px' }}>
            
            {/* Personal Greeting */}
            <div style={{ marginBottom: '30px' }}>
              {firstName && (
                <p style={{ 
                  fontSize: '16px', 
                  marginBottom: '10px',
                  color: '#374151'
                }}>
                  Hi {firstName},
                </p>
              )}
              <p style={{ 
                fontSize: '16px', 
                marginBottom: '15px',
                color: '#374151'
              }}>
                Thank you for using our PPM Tool Finder! Based on your criteria analysis, 
                I&apos;ve prepared your personalized comparison report.
              </p>
            </div>

            {/* Top Recommendation */}
            {topTool && (
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '2px solid #0057B7',
                borderRadius: '8px',
                padding: '25px',
                marginBottom: '30px'
              }}>
                <h2 style={{
                  color: '#0057B7',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginTop: '0',
                  marginBottom: '15px'
                }}>
                  🏆 Top Recommendation: {topTool.tool.name}
                </h2>
                <p style={{
                  fontSize: '16px',
                  marginBottom: '10px',
                  color: '#374151'
                }}>
                  <strong>Match Score:</strong> {Math.round(topTool.score)}%
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: '0'
                }}>
                  This tool best aligns with your {selectedCriteria.length} priority criteria 
                  across {selectedTools.length} tools analyzed.
                </p>
              </div>
            )}

            {/* Top 3 Rankings */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{
                color: '#1f2937',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '20px'
              }}>
                Your Top 3 Recommendations:
              </h3>
              
              {topRecommendations.slice(0, 3).map((rec, index) => (
                <div key={rec.tool.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '15px',
                  backgroundColor: index === 0 ? '#fef3c7' : '#f9fafb',
                  border: `1px solid ${index === 0 ? '#f59e0b' : '#e5e7eb'}`,
                  borderRadius: '6px',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    backgroundColor: index === 0 ? '#f59e0b' : '#6b7280',
                    color: 'white',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginRight: '15px',
                    flexShrink: 0
                  }}>
                    {rec.rank}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#1f2937' }}>{rec.tool.name}</strong>
                    <span style={{ 
                      color: '#6b7280', 
                      fontSize: '14px',
                      marginLeft: '10px'
                    }}>
                      {Math.round(rec.score)}% match
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart Image */}
            {chartImageUrl && (
              <div style={{
                textAlign: 'center' as const,
                marginBottom: '30px'
              }}>
                <h3 style={{
                  color: '#1f2937',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '15px'
                }}>
                  Visual Comparison Chart:
                </h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={chartImageUrl} 
                  alt="PPM Tools Comparison Chart" 
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}
                />
              </div>
            )}

            {/* Analysis Summary */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '30px'
            }}>
              <h3 style={{
                color: '#1f2937',
                fontSize: '16px',
                fontWeight: 'bold',
                marginTop: '0',
                marginBottom: '15px'
              }}>
                Analysis Summary:
              </h3>
              <ul style={{
                margin: '0',
                paddingLeft: '20px',
                color: '#4b5563'
              }}>
                <li style={{ marginBottom: '8px' }}>
                  <strong>{selectedTools.length}</strong> PPM tools analyzed
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>{selectedCriteria.length}</strong> criteria evaluated
                </li>
                <li style={{ marginBottom: '8px' }}>
                  Analysis based on your specific priority weighting
                </li>
              </ul>
            </div>

            {/* CTA Section */}
            <div style={{
              textAlign: 'center' as const,
              padding: '25px',
              backgroundColor: '#0057B7',
              borderRadius: '8px',
              marginBottom: '30px'
            }}>
              <h3 style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 'bold',
                marginTop: '0',
                marginBottom: '15px'
              }}>
                Ready to Implement Your PPM Solution?
              </h3>
              <p style={{
                color: '#e0e7ff',
                fontSize: '14px',
                marginBottom: '20px'
              }}>
                Let&apos;s discuss how to successfully implement your chosen PPM tool 
                and maximize your project portfolio success.
              </p>
              <p style={{
                color: '#e0e7ff',
                fontSize: '14px',
                marginBottom: '0'
              }}>
                Questions about your results? Reply to this email for guidance.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '30px 40px',
            textAlign: 'center' as const,
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{ marginBottom: '20px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="https://panoramic-solutions.com/images/Wagner_Headshot_2024.webp" 
                alt="Matt Wagner" 
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  marginBottom: '10px'
                }}
              />
              <p style={{
                margin: '0',
                fontSize: '14px',
                color: '#4b5563'
              }}>
                <strong>Matt Wagner, PMP</strong><br />
                Project Portfolio Management Expert<br />
                Panoramic Solutions
              </p>
            </div>
            
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              lineHeight: '1.4'
            }}>
              <p style={{ margin: '5px 0' }}>
                📧 <a href="mailto:matt.wagner@panoramic-solutions.com" style={{ color: '#0057B7' }}>
                  matt.wagner@panoramic-solutions.com
                </a>
              </p>
              <p style={{ margin: '5px 0' }}>
                🌐                 <a href="https://panoramic-solutions.com" style={{ color: '#0057B7' }}>
                  panoramic-solutions.com
                </a>
              </p>
              <p style={{ margin: '15px 0 5px 0', fontSize: '11px' }}>
                <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>
                  Unsubscribe
                </a> | 
                <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', marginLeft: '8px' }}>
                  Email Preferences
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
