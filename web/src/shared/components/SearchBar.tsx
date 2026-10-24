import React from 'react'
import { Box, IconButton } from '@mui/material'
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  width?: number | string | Record<string, number | string>
  height?: number
  autoFocus?: boolean
  showClear?: boolean
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  width = { xs: 140, sm: 200 },
  height = 38,
  autoFocus = false,
  showClear = true,
}: SearchBarProps) {
  return (
    <Box
      sx={{
        height,
        px: 1.5,
        bgcolor: m3Tokens.surfaceContainer,
        border: `1px solid ${m3Tokens.outlineVariant}`,
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        transition: 'border-color 0.2s ease',
        '&:focus-within': {
          borderColor: m3Tokens.primary,
        },
      }}
    >
      <SearchIcon sx={{ fontSize: 16, color: m3Tokens.onSurfaceVariant, opacity: 0.8, flexShrink: 0 }} />
      <Box
        component="input"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        sx={{
          border: 'none',
          outline: 'none',
          bgcolor: 'transparent',
          color: m3Tokens.onSurface,
          fontSize: 13,
          fontFamily: m3Tokens.fontSans,
          width,
          '&::placeholder': {
            color: m3Tokens.onSurfaceVariant,
            opacity: 0.65,
          },
        }}
      />
      {showClear && value && (
        <IconButton
          size="small"
          onClick={() => onChange('')}
          sx={{
            p: 0.25,
            color: m3Tokens.onSurfaceVariant,
            '&:hover': { color: m3Tokens.onSurface },
          }}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      )}
    </Box>
  )
}
