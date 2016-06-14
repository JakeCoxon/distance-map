import React from 'react'
import { observer } from 'mobx-react'

const cellStyle = {
    width: 30, height: 30,
    lineHeight: '30px',
    display: 'inline-block',
    border: '1px solid black',
    fontSize: 12,
    verticalAlign: 'middle',
    textAlign: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    position: 'relative'
}
const rowStyle = {
    fontSize: 0
}
const iconStyle = {
    width: 20, height: 20,
    display: 'inline-block',
    position: 'absolute',
    left: '50%', top: '50%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%'
}

@observer
class TileGridView extends React.Component {

    mouseDown = false;
    selectedData = undefined;

    componentDidMount() {
        window.addEventListener('mouseup', () => { 
            this.mouseDown = false;
            this.tileSelect = undefined
        })
    }
    render() {

        const { width, height, tileSelect, tileApply, tileProps } = this.props;

        return (<div>{_.range(height).map(y => {

            return (<div key={y} style={rowStyle}>
                {_.range(width).map(x => {

                    const { value, iconColor, ...style } = tileProps(x, y);
                    const style = {
                        ...cellStyle, ...style
                    }

                    const mouseMove = () => {
                        if (this.mouseDown) {
                            tileApply(x, y, this.selectedData);
                        }
                    }
                    const mouseDown = (ev) => {
                        if (ev.button === 0) {
                            this.mouseDown = true;
                            this.selectedData = tileSelect(x, y);
                            tileApply(x, y, this.selectedData);
                        }
                    }

                    return <div key={x} style={style} 
                        onMouseDown={mouseDown}
                        onMouseMove={mouseMove}>
                            { iconColor ? <div style={{ ...iconStyle, backgroundColor: iconColor }} /> : undefined }
                            <span style={{ position: 'relative' }}>
                                {typeof value !== 'undefined' ? Math.round(value * 100) / 100 : ''}
                            </span>
                        </div>

                })}
            </div>);

        })}</div>);
    }

}

export default TileGridView;