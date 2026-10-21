import React, { useState } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Terminal as TerminalIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup';

// Language metadata helper
const LANGUAGE_META = {
  python: { label: 'Python', filename: 'main.py', icon: '🐍' },
  bash: { label: 'Bash', filename: 'script.sh', icon: '🐚' },
  javascript: { label: 'JavaScript', filename: 'index.js', icon: '⚡' },
  html: { label: 'HTML', filename: 'index.html', icon: '🌐' },
  sql: { label: 'SQL', filename: 'query.sql', icon: '🗄️' },
};

export default function CodeBlockView({
  code = '',
  language = 'python',
  maxHeight = '420px',
  showCopy = true,
  filenameOverride,
}) {
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || 'python').toLowerCase().trim();
  const meta = LANGUAGE_META[cleanLang] || {
    label: cleanLang.toUpperCase(),
    filename: `code.${cleanLang}`,
    icon: '💻',
  };

  const filename = filenameOverride || meta.filename;

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe syntax highlight with Prism
  const grammar = Prism.languages[cleanLang] || Prism.languages.python || Prism.languages.clike;
  const safeCode = code || '# Sin código ingresado';
  let highlightedHtml = '';
  try {
    highlightedHtml = Prism.highlight(safeCode, grammar, cleanLang);
  } catch (err) {
    highlightedHtml = safeCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Calculate lines for gutter
  const lineCount = (safeCode.match(/\n/g) || []).length + 1;
  const linesArray = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <Box
      sx={{
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #30363d',
        bgcolor: '#0d1117', // GitHub dark / VS Code aesthetic
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Menlo', monospace",
        my: 2,
      }}
    >
      {/* IDE Top Window Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.8,
          py: 0.9,
          bgcolor: '#161b22',
          borderBottom: '1px solid #30363d',
          userSelect: 'none',
        }}
      >
        {/* Left: Window Traffic Light Dots */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 11,
              height: 11,
              borderRadius: '50%',
              bgcolor: '#ff5f56',
              boxShadow: '0 0 4px rgba(255, 95, 86, 0.5)',
            }}
          />
          <Box
            sx={{
              width: 11,
              height: 11,
              borderRadius: '50%',
              bgcolor: '#ffbd2e',
              boxShadow: '0 0 4px rgba(255, 189, 46, 0.5)',
            }}
          />
          <Box
            sx={{
              width: 11,
              height: 11,
              borderRadius: '50%',
              bgcolor: '#27c93f',
              boxShadow: '0 0 4px rgba(39, 201, 63, 0.5)',
            }}
          />

          {/* Active File Tab */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.8,
              ml: 1.5,
              px: 1.4,
              py: 0.3,
              borderRadius: '6px',
              bgcolor: '#0d1117',
              border: '1px solid #30363d',
            }}
          >
            <Typography component="span" sx={{ fontSize: '0.82rem' }}>
              {meta.icon}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#c9d1d9',
                fontFamily: 'inherit',
                letterSpacing: '0.3px',
              }}
            >
              {filename}
            </Typography>
          </Box>
        </Box>

        {/* Right: Language Badge & Copy Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              px: 1,
              py: 0.2,
              borderRadius: '4px',
              bgcolor: 'rgba(56, 139, 253, 0.15)',
              border: '1px solid rgba(56, 139, 253, 0.3)',
              color: '#58a6ff',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {meta.label}
          </Box>

          {showCopy && (
            <Tooltip title={copied ? '¡Copiado!' : 'Copiar código'}>
              <IconButton
                size="small"
                onClick={handleCopy}
                sx={{
                  color: copied ? '#3fb950' : '#8b949e',
                  p: 0.5,
                  borderRadius: '6px',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    color: '#c9d1d9',
                  },
                }}
              >
                {copied ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Code Area with Line Numbers */}
      <Box
        sx={{
          display: 'flex',
          maxHeight,
          overflowY: 'auto',
          overflowX: 'auto',
          p: 1.5,
          fontSize: '0.9rem',
          lineHeight: 1.6,
          // Custom scrollbars
          '&::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: '#0d1117',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#30363d',
            borderRadius: 4,
          },
        }}
      >
        {/* Left Gutter: Line Numbers */}
        <Box
          sx={{
            userSelect: 'none',
            textAlign: 'right',
            pr: 1.8,
            pl: 0.5,
            color: '#484f58',
            borderRight: '1px solid #21262d',
            fontFamily: 'inherit',
          }}
        >
          {linesArray.map((num) => (
            <Box key={num} sx={{ minHeight: '1.6em' }}>
              {num}
            </Box>
          ))}
        </Box>

        {/* Right Code Content with Syntax Styles */}
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 0,
            pl: 2,
            flex: 1,
            color: '#e6edf3',
            fontFamily: 'inherit',
            whiteSpace: 'pre',
            tabSize: 4,
            // Prism Token Colors (VS Code / GitHub Dark theme)
            '& .token.comment, & .token.prolog, & .token.doctype, & .token.cdata': {
              color: '#8b949e',
              fontStyle: 'italic',
            },
            '& .token.punctuation': {
              color: '#c9d1d9',
            },
            '& .token.property, & .token.tag, & .token.constant, & .token.symbol': {
              color: '#79c0ff',
            },
            '& .token.boolean, & .token.number': {
              color: '#ff7b72',
              fontWeight: 600,
            },
            '& .token.selector, & .token.attr-name, & .token.string, & .token.char, & .token.builtin': {
              color: '#a5d6ff',
            },
            '& .token.operator, & .token.entity, & .token.url': {
              color: '#d2a8ff',
            },
            '& .token.keyword': {
              color: '#ff7b72',
              fontWeight: 600,
            },
            '& .token.function, & .token.class-name': {
              color: '#d2a8ff',
              fontWeight: 600,
            },
            '& .token.variable, & .token.regex, & .token.important': {
              color: '#ffa657',
            },
            '& .token.parameter': {
              color: '#e6edf3',
            },
          }}
        >
          <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        </Box>
      </Box>
    </Box>
  );
}
