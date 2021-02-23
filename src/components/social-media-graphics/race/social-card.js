import React from 'react'
import classnames from 'classnames'

import { renderedComponent } from '~plugins/gatsby-render-components'

import { FormatNumber } from '~components/utils/format'

import Logo from '~images/ctp-icon-small.png'
import CarLogo from '~images/car-logo-small.png'

import SocialCardFootnotes from './footnotes'
import SocialCardHeader from './header'
import NoDataSocialCard from './no-data'
import { getStateStatus, getGroups, getBarWidth } from './utils'

import socialCardStyle from './social-card.module.scss'

const getFootnoteStatuses = (stateGroups, stateName) => {
  const groups = stateGroups
  let showSmallNFootnote = false
  let asteriskFootnote = null

  // if any of the showAsterisk values is true
  groups.forEach(group => {
    if (group.showAsterisk) {
      showSmallNFootnote = true // set showSmallNFootnote to true
    }
  })

  // special case to add an asterisk for Montana AIAN
  if (stateName === 'Montana') {
    groups.forEach((group, index) => {
      if (group.label === 'American Indian/ Alaska Native') {
        groups[index].showCross = true
      }
    })
    asteriskFootnote =
      'Montana includes Native Hawaiians and Other Pacific Islanders in this category.'
  }

  // special case to add an asterisk for New Mexico API
  if (stateName === 'New Mexico') {
    groups.forEach((group, index) => {
      if (group.label === 'Asian\u200a/\u200aPacific Islander') {
        groups[index].showCross = true
      }
    })
    asteriskFootnote =
      'New Mexico defines this category as Asian alone for case data, and Asian/Pacific Islander for death data.'
  }
  return {
    showSmallNFootnote,
    asteriskFootnote,
  }
}

// gets the width of the bar for the bar charts
const getWidthPercentage = (number, max) => (number / max) * 100

const ChartBar = ({
  style,
  metric,
  worstMetricValue,
  square,
  isOneChart,
  showAsterisk = false,
  isDeaths,
}) => {
  const widthPercentage = getWidthPercentage(metric, worstMetricValue)

  const BarContent = ({ value, asterisk = false }) => (
    <span>
      <FormatNumber number={value} />
      {asterisk && '*'}
    </span>
  )

  return (
    <div className={socialCardStyle.barContainer}>
      {isDeaths && <div className={socialCardStyle.deathBarSpacer} />}
      <div
        className={classnames(
          socialCardStyle.bar,
          style,
          widthPercentage !== 0 && socialCardStyle.hasInnerLabel,
        )}
        style={{
          width: `${getBarWidth(
            metric,
            worstMetricValue,
            square,
            isOneChart,
          )}px`,
        }}
      >
        {widthPercentage > 50 && (
          <BarContent value={metric} asterisk={showAsterisk} />
        )}
      </div>
      {widthPercentage <= 50 && (
        <BarContent value={metric} asterisk={showAsterisk} />
      )}
    </div>
  )
}

const ChartRow = ({
  group,
  stateStatus,
  worstCasesValue,
  worstDeathsValue,
  square,
}) => {
  const { label, style, cases, deaths, showAsterisk, showCross } = group

  const BarLabel = ({ barLabel, cross }) => (
    <span className={socialCardStyle.barLabel}>
      {barLabel}
      {cross && '†'}
    </span>
  )

  const InsufficientDataPlaceholder = ({ isDeaths }) => {
    const nullValue = 'No data reported' // the value to show for the empty state
    return (
      <span
        className={classnames(
          socialCardStyle.insufficientData,
          isDeaths && socialCardStyle.insufficientDataDeaths,
        )}
      >
        {nullValue}
      </span>
    )
  }

  return (
    <>
      <BarLabel barLabel={label} cross={showCross} />
      {!stateStatus.deathsOnly && (
        <>
          {cases === null ? (
            <InsufficientDataPlaceholder />
          ) : (
            <ChartBar
              style={style}
              metric={cases}
              worstMetricValue={worstCasesValue}
              square={square}
              isOneChart={stateStatus.oneChart}
            />
          )}
        </>
      )}
      {!stateStatus.casesOnly && (
        <>
          {deaths === null ? (
            <InsufficientDataPlaceholder isDeaths />
          ) : (
            <ChartBar
              style={style}
              metric={deaths}
              worstMetricValue={worstDeathsValue}
              square={square}
              showAsterisk={showAsterisk}
              isOneChart={stateStatus.oneChart}
              isDeaths
            />
          )}
        </>
      )}
    </>
  )
}

const StateRaceSocialCard = renderedComponent(
  ({
    state,
    combinedStates,
    square = false,
    statesReportingCases,
    statesReportingDeaths,
    lastUpdatedByCtp,
  }) => {
    if (state === undefined) {
      return <></>
    }
    if (state.name === 'Guam') {
      return <></>
    }
    const stateStatus = getStateStatus(state, combinedStates)

    // handle empty state
    if (stateStatus.noCharts) {
      return <NoDataSocialCard stateName={state.name} square={square} />
    }

    const { groups, worstCasesValue, worstDeathsValue } = getGroups(state)

    // sort groups by deaths if only deaths are reported
    // (this is sorted by cases in utils.js by default)
    if (stateStatus.deathsOnly) {
      groups.sort((a, b) => {
        // sort bars by # of deaths
        if (a.deaths >= b.deaths) {
          return -1
        }
        return 1
      })
    }

    const { showSmallNFootnote, asteriskFootnote } = getFootnoteStatuses(
      groups,
      state.name,
    )

    return (
      <div
        className={classnames(
          socialCardStyle.wrapper,
          square && socialCardStyle.square,
        )}
      >
        <p className={socialCardStyle.header}>
          <SocialCardHeader
            state={state}
            combinedStates={combinedStates}
            lastUpdatedByCtp={lastUpdatedByCtp}
          />
        </p>
        <div
          className={classnames(
            socialCardStyle.grid,
            stateStatus.casesOnly && socialCardStyle.casesOnly,
            stateStatus.deathsOnly && socialCardStyle.deathsOnly,
          )}
        >
          {/* Spacers for CSS Grid */}
          <span />
          <span />
          <span />
          <span />
          {stateStatus.oneChart && <span />}
          {!stateStatus.deathsOnly && (
            <span
              className={classnames(
                socialCardStyle.casesHeader,
                socialCardStyle.barHeader,
              )}
            >
              Cases per 100,000 people
            </span>
          )}
          {!stateStatus.casesOnly && (
            <span
              className={classnames(
                socialCardStyle.deathsHeader,
                socialCardStyle.barHeader,
              )}
            >
              Deaths per 100,000 people
            </span>
          )}
          {groups.map(group => (
            <ChartRow
              group={group}
              worstCasesValue={worstCasesValue}
              worstDeathsValue={worstDeathsValue}
              square={square}
            />
          ))}
        </div>

        <div className={socialCardStyle.footer}>
          <SocialCardFootnotes
            state={state}
            stateName={state.name}
            statesReportingCases={statesReportingCases}
            statesReportingDeaths={statesReportingDeaths}
            showSmallNFootnote={showSmallNFootnote}
            asteriskFootnote={asteriskFootnote}
          />
          <div className={socialCardStyle.logosContainer}>
            <img src={CarLogo} alt="" className={socialCardStyle.carLogo} />
            <img src={Logo} alt="" className={socialCardStyle.ctpLogo} />
          </div>
        </div>
      </div>
    )
  },
)

export default StateRaceSocialCard
