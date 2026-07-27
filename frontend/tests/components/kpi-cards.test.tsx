import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { KPICards } from '@/components/dashboard/kpi-cards'

// Mock the lucide-react icons so they don't cause issues during rendering in jsdom
vi.mock('lucide-react', () => {
  return {
    DollarSign: () => <div data-testid="icon-dollar" />,
    Users: () => <div data-testid="icon-users" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    PhoneMissed: () => <div data-testid="icon-phone-missed" />,
    TrendingUp: () => <div data-testid="icon-trending-up" />,
    TrendingDown: () => <div data-testid="icon-trending-down" />,
    Bot: () => <div data-testid="icon-bot" />,
    PhoneOutgoing: () => <div data-testid="icon-phone-outgoing" />,
  }
})

describe('KPICards Component', () => {
  it('renders all KPI cards with their titles', () => {
    render(<KPICards />)
    
    expect(screen.getByText("Today's Revenue")).toBeInTheDocument()
    expect(screen.getByText("Recovered Revenue")).toBeInTheDocument()
    expect(screen.getByText("Patients Today")).toBeInTheDocument()
    expect(screen.getByText("Appointments")).toBeInTheDocument()
    expect(screen.getByText("Missed Calls")).toBeInTheDocument()
    expect(screen.getByText("AI Conversations")).toBeInTheDocument()
    expect(screen.getByText("New Leads")).toBeInTheDocument()
    expect(screen.getByText("Conversion Rate")).toBeInTheDocument()
  })

  it('renders specific KPI values correctly', () => {
    render(<KPICards />)
    
    // Revenue
    expect(screen.getByText("$4,250")).toBeInTheDocument()
    
    // Patients
    expect(screen.getByText("24")).toBeInTheDocument()
  })
})
