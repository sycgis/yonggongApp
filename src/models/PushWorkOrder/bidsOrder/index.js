import React, { Component } from 'react'
import { List, Button, WingBlank, Radio, Picker } from 'antd-mobile'
import NewIcon from 'Components/NewIcon'
import { Header, Content } from 'Components'
import { tenderWayRadio, receiveTypeRadio, payModeRadio, paymethod, valuationWay } from 'Contants/fieldmodel'
import * as urls from 'Contants/urls'
import * as tooler from 'Contants/tooler'
import style from './index.css'
import TeachList from './teachList'
import ProjectList from './projectList'
import api from 'Util/api'
import storage from 'Util/storage'

const Item = List.Item
const RadioItem = Radio.RadioItem
class SelectClass extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showIndex: 0,
      receiveType: tooler.getQueryString('receiveType') || 1,
      proId: tooler.getQueryString('proId') || '',
      proVal: tooler.getQueryString('proVal') ? decodeURIComponent(decodeURIComponent(tooler.getQueryString('proVal'))) : '请选择',
      paymethodId: tooler.getQueryString('paymethodId') || '',
      paymethodVal: tooler.getQueryString('paymethodVal') ? decodeURIComponent(decodeURIComponent(tooler.getQueryString('paymethodVal'))) : '请选择',
      bidwayId: tooler.getQueryString('bidwayId') || '',
      bidwayVal: tooler.getQueryString('bidwayVal') ? decodeURIComponent(decodeURIComponent(tooler.getQueryString('bidwayVal'))) : '请选择',
      paymodeId: tooler.getQueryString('paymodeId') || '1',
      paymodeVal: tooler.getQueryString('paymodeVal') ? decodeURIComponent(decodeURIComponent(tooler.getQueryString('paymodeVal'))) : '直接付款',
      teachVal: tooler.getQueryString('teachVal') ? decodeURIComponent(decodeURIComponent(tooler.getQueryString('teachVal'))) : '不限',
      teachId: tooler.getQueryString('teachId') || '0',
      settleValue: parseInt(tooler.getQueryString('settleValue')) || 2,
      showform: false,
      showtech: false,
      url: tooler.getQueryString('url'),
      edittype: tooler.getQueryString('edittype') || 0,
      editSheetno: tooler.getQueryString('editSheetno') || 0
    }
  }
  componentDidMount() {
    if (this.state.edittype === '1') {
      this.getEditData()
    } else {
      let { receiveType } = this.state
      this.setState({
        showtech: parseInt(receiveType) === 2
      })
    }
  }
  getEditData = async () => { // 获取编辑数据
    let { editSheetno } = this.state
    let data = await api.PushOrder.tenderDetail({
      worksheet_no: editSheetno
    }) || false
    if (data) {
      storage.set('bidsData', data)
      this.setState({
        proId: data['prj_no'],
        proVal: '',
        receiveType: data['taker_type'],
        showtech: parseInt(data['taker_type']) === 2,
        teachId: data['aptitude_list'].length > 0 && data['taker_type'] === 2 ? data['aptitude_list'][0] : '0',
        teachVal: data['aptitude_list'].length > 0 && data['taker_type'] === 2 ? data['aptitude_list'][0] : '不限',
        bidwayId: '',
        bidwayVal: '',
        paymethodId: data['settle_fix_time'],
        paymethodVal: '',
        paymodeId: data['pay_way'],
        paymodeVal: ''
      })
    }
  }
  onChange = (value) => {
    this.setState({
      settleValue: value
    })
  }
  handleProject = (value) => { // 选择项目
    this.setState({
      showIndex: 4
    })
  }
  handleBidWay = (value) => { // 招标方式
    console.log(value)
    let newVal = tenderWayRadio.filter((item) => {
      return item['value'] === value[0]
    })[0]
    console.log(newVal)
    this.setState({
      bidwayId: newVal['value'],
      bidwayVal: newVal['label']
    })
  }
  handlePayMethod = (value) => { // 选择结算方式
    console.log(value)
    let newVal = paymethod.filter((item) => {
      return item['value'] === value[0]
    })[0]
    console.log(newVal)
    this.setState({
      paymethodId: newVal['value'],
      paymethodVal: newVal['label']
    })
  }
  handlePayMode = (value) => { // 付款方式
    console.log(value)
    let newVal = payModeRadio.filter((item) => {
      return item['value'] === value[0]
    })[0]
    console.log(newVal)
    this.setState({
      paymodeId: newVal['value'],
      paymodeVal: newVal['label']
    })
  }
  handleSelectTech = () => { // 资质要求
    this.setState({
      showIndex: 3
    })
  }
  closeDialog = (index) => {
    this.setState({
      showIndex: index
    })
  }
  teachListSubmit = (postJson) => {
    this.setState({
      showIndex: 0,
      teachId: postJson['value'].toString(),
      teachVal: postJson['label']
    })
  }
  projectListSubmit = (postJson) => {
    this.setState({
      showIndex: 0,
      proId: postJson['value'].toString(),
      proVal: postJson['label']
    })
  }
  handleChangeType = (value) => { // 选择接单方类型
    this.setState({
      receiveType: value,
      showtech: value === 2
    })
    console.log(value)
  }
  handleNextStep = () => { // 下一步
    let { teachVal, teachId, showtech, proId, proVal, paymethodId, paymethodVal, bidwayId, bidwayVal, paymodeId, paymodeVal, settleValue, receiveType, edittype, editSheetno } = this.state
    if (proId === '' || paymethodId === '' || bidwayId === '' || paymodeId === '') {
      this.setState({
        proVal: proId === '' ? <span style={{ color: '#ff0000' }}>未填写</span> : proVal,
        paymethodVal: paymethodId === '' ? <span style={{ color: '#ff0000' }}>未填写</span> : paymethodVal,
        bidwayVal: bidwayId === '' ? <span style={{ color: '#ff0000' }}>未填写</span> : bidwayVal,
        paymodeVal: paymodeId === '' ? <span style={{ color: '#ff0000' }}>未填写</span> : paymodeVal
      })
    } else {
      if (showtech === false) {
        teachId = 'null'
      }
      let urlJson = { url: 'HOME', teachVal, teachId, proId, proVal, paymethodId, paymethodVal, bidwayId, bidwayVal, paymodeId, paymodeVal, settleValue, receiveType, edittype, editSheetno }
      console.log('urlJson:', urlJson)
      let skipurl = tooler.parseJsonUrl(urlJson)
      console.log('skipurl:', skipurl)
      this.props.match.history.push(urls.PUSHBIDSORDERFORM + '?' + skipurl)
    }
  }
  render() {
    let { url, showIndex, teachVal, showtech, proId, proVal, paymethodVal, bidwayVal, paymodeVal, settleValue, receiveType } = this.state
    return <div>
      <div className='pageBox gray' style={{ display: showIndex === 0 ? 'block' : 'none' }}>
        <Header
          title='发布招标'
          leftIcon='icon-back'
          leftTitle1='返回'
          leftClick1={() => {
            if (url) {
              this.props.match.history.push(urls[url])
            } else {
              this.props.match.history.go(-1)
            }
          }}
        />
        <Content>
          <List renderHeader={() => '选择工单关联的项目信息'} className={style['select-class-list']}>
            <Item extra={proVal} arrow='horizontal' onClick={this.handleProject} thumb={<NewIcon type='icon-xiangmuxiaoxi' className={style['icon-class-haiwai']} />}>项目<em className={style['asterisk']}>*</em></Item>
          </List>
          <List className={style['list-radio']} renderHeader={() => '选择接单方类型'}>
            {
              receiveTypeRadio.map((item, index, ary) => {
                return (
                  <Radio
                    key={item.value}
                    checked={parseInt(receiveType) === item.value}
                    name='salary_payment_way'
                    className={style['pro-radio']}
                    onChange={() => this.handleChangeType(item.value)}
                  >{item.label}</Radio>
                )
              })
            }
          </List>
          <List style={{ display: showtech === true ? 'block' : 'none' }} renderHeader={() => '资质要求只能允许满足相关资质要求的企业接单'} className={style['select-class-list']}>
            <Item extra={teachVal} arrow='horizontal' onClick={this.handleSelectTech} thumb={<NewIcon type='icon-zizhizhengshu' className={style['icon-class-haiwai']} />}>资质要求</Item>
          </List>
          <List renderHeader={() => '选择招标方式'} className={style['select-class-list']}>
            <Picker data={tenderWayRadio} cols={1} extra={bidwayVal} onOk={this.handleBidWay}>
              <Item arrow='horizontal' thumb={<NewIcon type='icon-zhaobiaopaimai' className={style['icon-class-haiwai']} />}>招标方式<em className={style['asterisk']}>*</em></Item>
            </Picker>
          </List>
          <List renderHeader={() => '选择结算方式'} className={style['select-class-list']}>
            <Picker data={paymethod} cols={1} extra={paymethodVal} onOk={this.handlePayMethod}>
              <Item arrow='horizontal' thumb={<NewIcon type='icon-settlemethod' className={style['icon-class-haiwai']} />}>结算方式<em className={style['asterisk']}>*</em></Item>
            </Picker>
          </List>
          <List renderHeader={() => '默认为直接付款，代付模式为由接招标所转发出的工单都由发招标方来付款'} className={style['select-class-list']}>
            <Picker data={payModeRadio} cols={1} extra={paymodeVal} onOk={this.handlePayMode}>
              <Item arrow='horizontal' thumb={<NewIcon type='icon-daifukuan' className={style['icon-class-haiwai']} />}>支付方式</Item>
            </Picker>
          </List>
          <List renderHeader={() => '选择计价方式'} className={`${style['select-class-list']} ${style['settle-type-list']}`}>
            {valuationWay.map(i => (
              <RadioItem key={i.value} checked={parseInt(settleValue) === i.value} onChange={() => this.onChange(i.value)}>
                {i.label}
              </RadioItem>
            ))}
          </List>
          <WingBlank className={style['classnext-step-btn']}><Button type='primary' onClick={this.handleNextStep}>下一步</Button></WingBlank>
        </Content>
      </div>
      {
        showIndex === 3 ? <TeachList onClose={() => this.closeDialog(0)} onSubmit={(postJson) => this.teachListSubmit(postJson)} /> : null
      }
      {
        showIndex === 4 ? <ProjectList match={this.props.match} data={{ proId }} onClose={() => this.closeDialog(0)} onSubmit={(postJson) => this.projectListSubmit(postJson)} /> : null
      }
    </div>
  }
}

export default SelectClass
