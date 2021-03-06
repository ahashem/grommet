// (C) Copyright 2016 Hewlett Packard Enterprise Development LP

import React, { Component, Children, PropTypes } from 'react';
import { padding, debounceDelay } from './utils';
import CSSClassnames from '../../utils/CSSClassnames';

import Axis from './Axis';
import Layers from './Layers';
import Base from './Base';
import Grid from './Grid';
import Area from './Area';
import Line from './Line';
import Bar from './Bar';
import Marker from './Marker';
import MarkerLabel from './MarkerLabel';
import HotSpots from './HotSpots';
import Range from './Range';

const CLASS_ROOT = CSSClassnames.CHART;
const CHART_BASE = CSSClassnames.CHART_BASE;

export default class Chart extends Component {

  constructor(props, context) {
    super(props, context);
    this._onResize = this._onResize.bind(this);
    this._layout = this._layout.bind(this);
    this.state = { alignTop: 0, alignLeft: 0, alignHeight: 0, alignWidth: 0 };
  }

  componentDidMount () {
    window.addEventListener('resize', this._onResize);
    this._layout();
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.vertical !== nextProps.vertical) {
      this.setState({ layoutNeeded: true });
    }
  }

  componentDidUpdate () {
    if (this.state.layoutNeeded) {
      this._layout();
      this.setState({ layoutNeeded: false });
    }
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this._onResize);
  }

  _onResize () {
    // debounce
    clearTimeout(this._resizeTimer);
    this._resizeTimer = setTimeout(this._layout, debounceDelay);
  }

  _layout () {
    const { horizontalAlignWith, verticalAlignWith, vertical,
      onMaxCount } = this.props;
    const chart = this.refs.chart;
    const chartRect = chart.getBoundingClientRect();
    const base = this.refs.chart.querySelector(`.${CHART_BASE}`);
    let alignWidth, alignLeft, alignRight, alignHeight, alignTop, alignBottom;
    let padAlign = true;

    if (horizontalAlignWith) {
      const elem = document.getElementById(horizontalAlignWith);
      if (elem) {
        const rect = elem.getBoundingClientRect();
        alignWidth = rect.width;
        alignLeft = rect.left - chartRect.left;
        alignRight = chartRect.right - rect.right;
        padAlign = false;
      }
    } else if (base) {
      const rect = base.getBoundingClientRect();
      alignWidth = rect.width;
      alignLeft = rect.left - chartRect.left;
      alignRight = chartRect.right - rect.right;
    }

    if (verticalAlignWith) {
      const elem = document.getElementById(verticalAlignWith);
      if (elem) {
        const rect = elem.getBoundingClientRect();
        alignHeight = rect.height;
        alignTop = rect.top - chartRect.top;
        alignBottom = chartRect.bottom - rect.bottom;
        padAlign = false;
      }
    } else if (base) {
      const rect = base.getBoundingClientRect();
      alignHeight = rect.height;
      alignTop = rect.top - chartRect.top;
      alignBottom = chartRect.bottom - rect.bottom;
    }

    this.setState({
      alignWidth: alignWidth,
      alignLeft: alignLeft,
      alignRight: alignRight,
      alignHeight: alignHeight,
      alignTop: alignTop,
      alignBottom: alignBottom,
      padAlign: padAlign
    });

    if (onMaxCount) {
      let maxCount;
      if (vertical) {
        maxCount = Math.floor(alignWidth / (4 * padding));
      } else {
        maxCount = Math.floor(alignHeight / (4 * padding));
      }
      if (maxCount !== this.state.maxCount) {
        this.setState({ maxCount: maxCount }, () => {
          onMaxCount(maxCount);
        });
      }
    }
  }

  render () {
    const { vertical, full, loading } = this.props;
    const { alignBottom, alignHeight, alignLeft, alignRight, alignTop,
      alignWidth, padAlign } = this.state;
    let classes = [CLASS_ROOT];
    if (vertical) {
      classes.push(`${CLASS_ROOT}--vertical`);
    }
    if (full) {
      classes.push(`${CLASS_ROOT}--full`);
    }
    if (loading) {
      classes.push(`${CLASS_ROOT}--loading`);
    }
    if (this.props.className) {
      classes.push(this.props.className);
    }

    // Align Axis children towards the Base|Layers|Chart
    let axisAlign = 'end';
    let children = Children.map(this.props.children, child => {

      // name comparison is to work around webpack alias issues in development
      if (child && (
        child.type === Axis || child.type.name === 'Axis' ||
        child.type === MarkerLabel || child.type.name === 'MarkerLabel'
        )) {

        if (vertical) {
          child = React.cloneElement(child, {
            style: {
              marginLeft: padAlign ? alignLeft + padding : alignLeft,
              marginRight: padAlign ? alignRight + padding : alignRight
            },
            align: axisAlign
          });
        } else {
          child = React.cloneElement(child, {
            style: {
              // We set the height just for Safari due to:
              // http://stackoverflow.com/questions/35532987/
              //    heights-rendering-differently-in-chrome-and-firefox/
              //    35537510#35537510
              // Chrome seems to have addressed this already.
              height: padAlign ? alignHeight - (2 * padding) : alignHeight,
              marginTop: padAlign ? alignTop + padding : alignTop,
              marginBottom: padAlign ? alignBottom + padding : alignBottom
            },
            align: axisAlign
          });
        }

      } else if (child &&
        (child.type === Layers || child.type.name === 'Layers')) {

        child = React.cloneElement(child, {
          height: alignHeight,
          width: alignWidth,
          style: { left: alignLeft, top: alignTop }
        });
        axisAlign = 'start';

      } else if (child && (
        child.type === Chart || child.type.name === 'Chart' ||
        child.type === Base || child.type.name === 'Base'
      )) {

        axisAlign = 'start';
      }

      return child;
    });

    if (loading) {
      children.push(
        <svg key="loading" className={`${CLASS_ROOT}-loading`}
          viewBox={`0 0 ${alignWidth} ${alignHeight}`}>
          <path d={`M0,${alignHeight / 2} L${alignWidth},${alignHeight / 2}`} />
        </svg>
      );
    }

    return (
      <div ref="chart" className={classes.join(' ')}>
        {children}
      </div>
    );
  }

};

Chart.propTypes = {
  full: PropTypes.bool,
  horizontalAlignWith: PropTypes.string,
  loading: PropTypes.bool,
  onMaxCount: PropTypes.func,
  vertical: PropTypes.bool,
  verticalAlignWith: PropTypes.string
};

export { Axis, Layers, Base, Grid, Area, Line, Bar, Marker, MarkerLabel,
  HotSpots, Range };
