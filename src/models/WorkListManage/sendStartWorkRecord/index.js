import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { Button, ListView, PullToRefresh, Toast, Modal, Icon } from 'antd-mobile'
import { Header, Content, DefaultPage } from 'Components'
import { workplanStatus } from 'Contants/fieldmodel'
import api from 'Util/api'
import * as tooler from 'Contants/tooler'
import style from './index.css'

const alert = Modal.alert
const NUM_ROWS = 20
const defaultSource = new ListView.DataSource({
  rowHasChanged: (row1, row2) => row1 !== row2,
})
class AccessRecord extends Component {
  constructor(props) {
    super(props)
    this.state = {
      pageIndex: 1,
      pageNos: 0,
      dataSource: [],
      defaultSource,
      refreshing: true,
      isLoading: true,
      height: document.documentElement.clientHeight,
      nodata: false,
      clickIndex: 0,
      attendTime: []
    }
  }
  componentDidMount() {
    this.getdataTemp()
  }
  getdataTemp = () => {
    const hei = document.documentElement.clientHeight - ReactDOM.findDOMNode(this.lv).offsetTop - 50
    this.genData().then((rdata) => {
      this.rData = rdata
      this.setState({
        dataSource: this.rData,
        height: hei,
        refreshing: false,
        isLoading: false
      })
    })
  }
  onRefresh = () => {
    console.log('onRefresh')
    this.setState({ refreshing: true, pageNos: 0, pageIndex: 1 })
    // simulate initial Ajax
    this.genData().then((rdata) => {
      this.rData = rdata
      this.setState({
        dataSource: this.rData,
        refreshing: false,
        isLoading: false,
      })
    })
  }
  onEndReached = (event) => {
    console.log('onEndReached')
    if (this.state.isLoading) {
      return
    }
    let { pageIndex, pageNos } = this.state
    // this.setState({ isLoading: true })
    let newIndex = pageIndex + 1
    if (newIndex > pageNos) {
      return false
    }
    this.genData(newIndex).then((rdata) => {
      this.rData = [...this.rData, ...rdata]
      this.setState({
        dataSource: this.rData,
        isLoading: false,
        pageIndex: newIndex
      })
    })
  }

  genData = async (pIndex = 1) => { // 获取数据
    const worksheetno = tooler.getQueryString('worksheetno')
    this.setState({
      isLoading: true
    })
    let data = await api.WorkListManage.sendWorkplanList({
      page: pIndex,
      limit: NUM_ROWS,
      worksheet_no: worksheetno
    }) || false
    if (data['currPageNo'] === 1 && data['list'].length === 0) {
      document.body.style.overflow = 'hidden'
      this.setState({
        nodata: true,
        pageNos: data['pageNos']
      })
    } else {
      document.body.style.overflow = 'auto'
      this.setState({
        nodata: false,
        pageNos: data['pageNos']
      })
    }
    return await data['list'] || []
  }
  showlistStatus = (item) => { // 状态按钮
    if (item['status'] === 3) { // 已完工
      return <div className={style['confirm-status']}>{
        workplanStatus.find(i => {
          return i['status'] === item['status']
        })['title']
      }</div>
    } else if (item['status'] === 1 || item['status'] === 4) { // 开工中
      return <div className={style['reject-status']}>{
        workplanStatus.find(i => {
          return i['status'] === item['status']
        })['title']
      }</div>
    } else if (item['status'] === 2) { // 完工待确认
      return <div>
        <Button type='primary' onClick={(e) => { this.getSolicit(e, item['task_no'], 1, item) }} size='small'>确认完工</Button>
        <Button type='primary' onClick={(e) => { this.getSolicit(e, item['task_no'], 2, item) }} size='small'>驳回</Button>
      </div>
    }
  }
  solicitfun = async (planno, type) => {
    let { dataSource } = this.state
    let currentIndex
    dataSource.map((item, index) => {
      if (item['task_no'] === planno) {
        currentIndex = index
      }
    })
    Toast.loading('提交中...', 0)
    let data = await api.WorkListManage.sendConfirmWork({
      task_no: planno,
      confirm_status: type
    }) || false
    Toast.hide()
    if (data) {
      dataSource[currentIndex] = data
      this.setState({
        dataSource
      })
      Toast.success('操作成功', 1.5)
    }
  }
  getSolicit = (e, planno, type, rowData) => {
    e.stopPropagation()
    if (type === 1) {
      alert('确定' + rowData['workload'] + rowData['workload_unit'] + '的工作量吗？', '', [
        { text: '取消' },
        { text: '确认', onPress: async () => {
          this.solicitfun(planno, type)
        } },
      ])
    } else if (type === 2) {
      alert('确定驳回整改吗？', '', [
        { text: '取消' },
        { text: '确认', onPress: () => {
          this.solicitfun(planno, type)
        } },
      ])
    }
  }
  handleRecordClick = (e, rowData) => {
    let attendTime = rowData['attend_time_list']
    let eIndex = e.currentTarget.getAttribute('index')
    this.setState({
      clickIndex: eIndex === this.state.clickIndex ? 0 : eIndex,
      attendTime
    })
  }
  render() {
    const { isLoading, nodata, height, dataSource, clickIndex, attendTime } = this.state
    const footerShow = () => {
      if (isLoading) {
        return null
      } else if (nodata) {
        return <DefaultPage type='nodata' title='暂无开工记录' />
      } else {
        return ''
      }
    }
    const separator = (sectionID, rowID) => (
      <div
        key={`${sectionID}-${rowID}`}
        style={{
          backgroundColor: '#F5F5F9',
          height: 8,
        }}
      />
    )
    const row = (rowData, sectionID, rowID) => {
      return <li key={rowData['task_no']}>
        <div index={rowData['task_no']} className={style['record-box']}>
          <div className={`${style['record-header']} my-bottom-border`}>
            <div className={style['header']} style={{ 'backgroundImage': 'url(' + rowData['tasker_avatar'] + ')' }}></div>
            <p className={style['name']}>{rowData['tasker_name']}{rowData['is_self'] === 1 ? <sapn>(自己)</sapn> : ''}</p>
            <div className={style['record-btn']}>
              {
                this.showlistStatus(rowData)
              }
            </div>
          </div>
          <div className={style['record-body']}>
            <time>开工时间：{rowData['started_at']}</time>
            {
              rowData['attend_time_list'].length > 0 ? <a index={rowData['task_no']} onClick={(e) => this.handleRecordClick(e, rowData)}><i>查看考勤</i><Icon type={clickIndex === rowData['task_no'] ? 'up' : 'down'} size='xs' /></a> : null
            }
            {
              Number(rowData['workload']) > 0 ? <span>工作量：{rowData['workload']}{rowData['workload_unit']}</span> : null
            }
          </div>
        </div>
        <div className={`${style['down-box']} my-top-border ${clickIndex === rowData['task_no'] ? style['show'] : style['hide']}`}>
          <h4>考勤时间：</h4>
          {
            attendTime.length > 0 ? attendTime.map((item, index) => { return <p key={index}>{item['on']} ~ {item['off']}</p> }) : null
          }
        </div>
      </li>
    }
    return <div className='pageBox gray'>
      <Header
        title='开工记录'
        leftIcon='icon-back'
        leftTitle1='返回'
        leftClick1={() => {
          this.props.match.history.go(-1)
        }}
      />
      <Content>
        <ul className={style['record-list']} style={{ height: document.documentElement.clientHeight - 50 }}>
          <ListView
            ref={(el) => {
              this.lv = el
            }}
            dataSource={this.state.defaultSource.cloneWithRows(dataSource)}
            renderFooter={() => (<div className={style['render-footer']}>
              {footerShow()}
            </div>)}
            renderRow={row}
            renderSeparator={separator}
            pullToRefresh={<PullToRefresh
              refreshing={this.state.refreshing}
              onRefresh={this.onRefresh}
            />}
            style={{
              height: height
            }}
            onEndReached={this.onEndReached}
            onEndReachedThreshold={120}
            initialListSize={NUM_ROWS}
            pageSize={NUM_ROWS}
          />
        </ul>
      </Content>
    </div>
  }
}

export default AccessRecord
