import React, { Component } from 'react'
import { List, Picker, Icon, Calendar } from 'antd-mobile'
import { Header, Content } from 'Components'
import { createForm } from 'rc-form'
import * as urls from 'Contants/urls'
import * as tooler from 'Contants/tooler'
import { attendanceList } from 'Contants/fieldmodel'
import history from 'Util/history'
import style from './style.css'
import api from 'Util/api'
// const now = new Date()
class EnginReality extends Component {
  constructor(props) {
    super(props)
    this.state = {
      proSelect: false,
      // showOrder: false,
      proData: [],
      worksheetData: [],
      dateShow: false,
      startTime: null,
      endTime: null,
      isLoading: true, // 考勤
      isLoadProj: true, // 项目
      isLoadWork: true, // 工单
      proId: '', // 项目id
      worksheetId: '', // 工单id
      // worksheetNo: '', // 工单编号
      attendanceData: [] // 考勤列表

    }
  }
  componentWillMount () {
    this.getProjectList()
    let toolers = tooler.parseURLParam()
    if (JSON.stringify(toolers) !== '{}') {
      if (toolers.hasOwnProperty('worksheetId')) {
        this.setState({ ...toolers, proSelect: true }, () => {
          this.onProChange([toolers.proId], toolers.worksheetId)
          setTimeout(() => {
            this.getEngList()
          }, 1000)
        })
      } else {
        this.setState({ ...toolers, proSelect: false })
      }
    }
  }
  getProjectList = async () => { // 获取项目
    this.setState({ isLoadProj: true })
    const proData = await api.Mine.engineeringLive.getPrjList({
    }) || false
    if (proData) {
      this.setState({
        proData,
        isLoadProj: false
      })
    }
  }
  getEngList = async () => { // 获取考勤打卡统计
    // console.log(tooler.formatDate(startTime))
    const { worksheetId, startTime, endTime, proId } = this.state
    history.replace(`?worksheetId=${worksheetId}&startTime=${tooler.formatDate(new Date(startTime))}&endTime=${tooler.formatDate(new Date(endTime))}&proId=${proId}`)
    this.setState({ isLoading: true })
    const data = await api.Mine.engineeringLive.getEngList({
      worksheet_no: worksheetId,
      start_date: tooler.formatDate(new Date(startTime)),
      end_date: tooler.formatDate(new Date(endTime))
    }) || false
    if (data) {
      this.setState({
        attendanceData: data,
        isLoading: false
      })
    }
  }

  onProChange = async (val, id = '') => { // 选择工单
    // let { proData } = this.state
    // let proLabel
    // for (const i of proData) {
    //   if (i['proId'] === val[0]) {
    //     proLabel = encodeURI(i['label'])
    //   }
    // }
    this.setState({ isLoadWork: true })
    const worksheetData = await api.Mine.engineeringLive.getworkSheetList({ // 获取工单列表
      prj_no: val[0]
    }) || false
    if (worksheetData) {
      this.setState({
        proSelect: true,
        proId: val[0],
        attendanceData: [],
        isLoading: true,
        worksheetData,
        isLoadWork: false,
        worksheetId: id
      })
    }
  }
  onWorkSheetChange = (val) => {
    const { startTime, endTime } = this.state
    this.setState({
      worksheetId: val[0]
    }, () => {
      if (val[0] && startTime && endTime) {
        this.getEngList()
      }
    })
  }
  hanleShowCalendar = () => {
    this.setState({
      dateShow: true
    })
  }
  handleDateCancel = () => {
    this.setState({
      dateShow: false,
      // startTime: null,
      // endTime: null,
    })
  }
  handleDateConfirm = (startTime, endTime) => {
    const { worksheetId } = this.state
    this.setState({
      dateShow: false,
      startTime: startTime,
      endTime: endTime,
    }, () => {
      if (worksheetId && startTime && endTime) {
        this.getEngList()
      }
    })
  }
  handleLeavesitu = (e) => {
    let { worksheetId, startTime, endTime, proId } = this.state
    let data = e.currentTarget.getAttribute('data-id').split('&')
    let id = data[0]
    // let num = data[1]
    // if (num > 0) {
    history.push(`${urls.LEAVESITU}?worksheetId=${worksheetId}&attend_status=${id}&startTime=${tooler.formatDate(new Date(startTime))}&endTime=${tooler.formatDate(new Date(endTime))}&proId=${proId}`)
    // }
  }
  render() {
    let { proSelect, proData, dateShow, startTime, endTime, proId, attendanceData, isLoading, isLoadProj, worksheetData, worksheetId, isLoadWork } = this.state
    const { getFieldDecorator } = this.props.form
    return (
      <div>
        <div className='pageBox'>
          <Header
            title='工程实况'
            leftIcon='icon-back'
            leftTitle1='返回'
            leftClick1={() => {
              history.go(-1)
            }}
          />
          <Content>
            { !isLoadProj
              ? <div className={style['engin-reality']}>
                <List className={`${style['input-form-list']}`} renderHeader={() => '项目名称'}>
                  {/* <Picker extra='请选择项目' className='myPicker' onChange={this.onProChange} data={proData} cols={1}>
                    <List.Item arrow='horizontal'></List.Item>
                  </Picker> */}
                  {getFieldDecorator('prj_id', {
                    initialValue: [proId],
                    rules: [
                      { required: true, message: '请选择项目' }
                    ]
                  })(
                    <Picker extra='请选择项目' className='myPicker' onChange={this.onProChange} data={proData} cols={1}>
                      <List.Item arrow='horizontal'></List.Item>
                    </Picker>
                  )}
                </List>
                {
                  proSelect
                    ? !isLoadWork
                      ? <List className={`${style['input-form-list']}`} renderHeader={() => '工单名称'}>
                        {getFieldDecorator('worksheet_id', {
                          initialValue: [worksheetId],
                          rules: [
                            { required: true, message: '请选择工单' }
                          ]
                        })(
                          <Picker extra='请选择工单' className='myPicker' onChange={this.onWorkSheetChange} data={worksheetData} cols={1}>
                            <List.Item arrow='horizontal'></List.Item>
                          </Picker>
                        )}
                      </List>
                      : null
                    : null
                }
                <div className={style['engin-user']}>
                  <a onClick={this.hanleShowCalendar}>{ startTime && endTime ? (new Date(startTime)).toLocaleDateString() + ' ~ ' + (new Date(endTime)).toLocaleDateString() : '请选择日期范围' } <Icon type='right' size='md' color=''/></a>
                </div>
                <ul className={style['attend']}>
                  {
                    attendanceData.length !== 0 && !isLoading
                      ? attendanceData.map(item => {
                        return <li key={item.attend_status}
                          onClick={this.handleLeavesitu}
                          data-id={`${item['attend_status']}&${item.number}`}
                          className='my-bottom-border'>
                          <p>{attendanceList[item.attend_status]}
                            { item.attend_status === 2 ? <span ><span>迟到</span><span>早退</span><span>未打卡</span></span> : null}
                          </p><Icon type='right' size='md' color='#ccc'/>
                          <em>{item.number}</em>
                        </li>
                      }) : <div className='nodata'>{attendanceData.length === 0 && !isLoading ? '暂无数据' : ''}</div>
                  }
                </ul>
              </div>
              : null
            }
          </Content>
          <div className={style['calendar-box']}>
            <Calendar
              visible={dateShow}
              onCancel={this.handleDateCancel}
              onConfirm={this.handleDateConfirm}
              // defaultDate={new Date()}
              defaultValue={[new Date(startTime || new Date()), new Date(endTime || new Date())]}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default createForm()(EnginReality)
