import React, { Component } from 'react'
import { List, Toast, InputItem, DatePicker, TextareaItem, WingBlank, Button, WhiteSpace } from 'antd-mobile'
import Loadable from 'react-loadable'
import { Header, Content } from 'Components'
import * as urls from 'Contants/urls'
import * as tooler from 'Contants/tooler'
import { createForm } from 'rc-form'
import NewIcon from 'Components/NewIcon'
import api from 'Util/api'
import { headersJson } from 'Util'
import style from './index.css'
import Address from 'Components/Address'
import storage from 'Util/storage'
import { onBackKeyDown } from 'Contants/tooler'
const Item = List.Item
let Upload = Loadable({
  loader: () => import('rc-upload'),
  loading: () => {
    return null
  },
  render(loaded, props) {
    let Upload = loaded.default
    return <Upload {...props}/>
  }
})
class FormBox extends Component {
  constructor(props) {
    super(props)
    this.state = {
      remarkShow: false,
      mapShow: false,
      hasError: false,
      startDate: '',
      endDate: '',
      address: '请选择施工地址',
      addressObj: {},
      fileList: [],
      urlJson: tooler.parseURLParam(),
      remark: '',
      bidsData: {}
    }
  }
  componentDidMount() {
    let { edittype } = this.state.urlJson
    if (edittype === '1') {
      let bidsData = storage.get('bidsData')
      this.setState({
        bidsData: bidsData,
        fileList: bidsData['attachment'],
        addressObj: {
          position: {
            lng: bidsData['coordinate']['lng'],
            lat: bidsData['coordinate']['lat'],
            cityCode: bidsData['city_code']
          }
        },
        address: bidsData['construction_place'],
        remark: bidsData['remark']
      })
    }
    if ('cordova' in window) {
      document.removeEventListener('backbutton', onBackKeyDown, false)
      document.addEventListener('backbutton', this.backButtons, false)
    }
  }
  componentWillUnmount () {
    if ('cordova' in window) {
      document.removeEventListener('backbutton', this.backButtons)
      document.addEventListener('backbutton', onBackKeyDown, false)
    }
  }
  backButtons = (e) => {
    let { remarkShow, mapShow } = this.state
    if (remarkShow) {
      e.preventDefault()
      this.props.form.setFieldsValue({ remark: '' })
      this.setState({
        remarkShow: false,
        remark: ''
      })
    } else if (mapShow) {
      e.preventDefault()
      this.setState({
        mapShow: false
      })
    } else {
      this.props.match.history.push(urls.PUSHBIDORDER + '?' + tooler.parseJsonUrl(this.state.urlJson))
    }
  }
  handleRemarkClick = () => {
    this.setState({
      remarkShow: true
    })
  }
  onErrorClick = (field) => {
    Toast.info(this.props.form.getFieldError(field).join('、'))
  }
  delUploadList = (param) => { // 删除附件
    const { fileList } = this.state
    let newFileList = []
    fileList.map((item) => {
      if (item.path !== param['path']) {
        newFileList.push(item)
      }
    })
    this.setState({
      fileList: newFileList
    })
  }
  handleSelectMap = () => {
    if (!('cordova' in window) && tooler.getQueryString('chrome') === null) {
      history.pushState(null, null, tooler.addParameterToURL('chrome=1'))
    }
    this.setState({
      mapShow: true
    })
  }
  closeAddress = () => {
    this.setState({
      mapShow: false
    })
  }
  submitAddress = (mapJson) => {
    console.log('mapJson:', mapJson)
    this.props.form.setFieldsValue({
      construction_place: mapJson.nowAddress
    })
    this.setState({
      mapShow: false,
      address: mapJson.nowAddress,
      addressObj: mapJson
    })
  }
  handleStartDate = (date) => {
    this.setState({ startDate: date })
  }
  handleEndDate = (date) => {
    this.setState({ endDate: date })
  }
  onSubmit = () => { // 提交
    let { addressObj, fileList } = this.state
    let { teachId, proId, receiveType, bidwayId, paymethodId, paymodeId, settleValue, edittype, editSheetno } = this.state.urlJson
    let attachment = []
    fileList.map(item => {
      attachment.push(item['path'])
    })
    this.props.form.validateFields({ force: true }, async (error) => {
      if (!error) {
        let formJson = this.props.form.getFieldsValue()
        let postJson = {
          ...{ worksheet_type: 1 },
          ...formJson,
          ...{ prj_no: proId, taker_type: receiveType, tender_way: bidwayId, settle_fix_time: paymethodId, pay_way: paymodeId, valuation_way: settleValue },
          ...{ start_time: tooler.formatDate(formJson['start_time']), end_time: tooler.formatDate(formJson['end_time']), bid_end_time: tooler.formatDate(formJson['bid_end_time']) },
          ...{ coordinate: { lng: addressObj.position.lng, lat: addressObj.position.lat }},
          ...{ city_code: addressObj.position.cityCode },
          ...{ aptitude_code_list: teachId !== 'null' && teachId !== '0' ? [teachId] : [] },
          attachment
        }
        console.log(postJson)
        Toast.loading('提交中...', 0)
        let data
        if (edittype === '1') {
          let newPostJson = {
            ...postJson,
            worksheet_no: editSheetno
          }
          data = await api.PushOrder.editTender(newPostJson) || false
        } else {
          data = await api.PushOrder.tender(postJson) || false
        }
        if (data) {
          Toast.hide()
          if (edittype === '1') {
            Toast.success('修改成功', 1, () => {
              storage.remove('bidsData')
              this.props.match.history.push(`${urls.WORKLISTMANAGE}?listType=1`)
            })
          } else {
            Toast.success('发布成功', 1, () => {
              this.props.match.history.push(`${urls.BIDORDERRESULT}?worksheetno=${data['worksheet_no']}`)
            })
          }
        }
      }
    })
  }
  handleCordovaImg = () => {
    tooler.corovaUploadImg(3, (data) => {
      this.setState(({ fileList }) => ({
        fileList: [...fileList, data]
      }))
    })
  }
  render() {
    const { getFieldProps, getFieldError, getFieldValue, setFieldsValue } = this.props.form
    let { fileList, remarkShow, startDate, endDate, mapShow, address, remark, bidsData } = this.state
    console.log('fileList:', fileList)
    console.log('bidsData:', bidsData)
    let { bidwayId, edittype } = this.state.urlJson
    let newHeader = tooler.requestHeader(headersJson)
    delete newHeader['Content-Type']
    const uploaderProps = {
      action: api.Common.uploadFile,
      data: { type: 3 },
      multiple: false,
      headers: newHeader,
      onSuccess: (file) => {
        if (file['code'] === 0) {
          Toast.hide()
          Toast.success('上传成功', 1)
          this.setState(({ fileList }) => ({
            fileList: [...fileList, file['data']],
          }))
        } else {
          Toast.fail(file['msg'], 1)
        }
      },
      beforeUpload(file) {
        Toast.loading('上传中...', 0)
      }
    }
    return <div>
      <div className='pageBox gray' style={{ display: mapShow ? 'none' : 'block' }}>
        <Header
          title={remarkShow ? '招标备注' : '发布招标'}
          leftIcon='icon-back'
          leftTitle1='返回'
          leftClick1={() => {
            if (remarkShow) {
              setFieldsValue({ remark: '' })
              this.setState({ remarkShow: false, remark: '' })
            } else {
              let { urlJson } = this.state
              console.log('parseurl:', tooler.parseJsonUrl(urlJson))
              this.props.match.history.push(urls.PUSHBIDORDER + '?' + tooler.parseJsonUrl(urlJson))
            }
          }}
          rightTitle={remarkShow ? '确认' : null}
          rightClick={() => {
            let bool = !!getFieldError('remark')
            bool ? Toast.info(getFieldError('remark').join('、')) : this.setState({ remarkShow: false, remark: getFieldValue('remark') })
          }}
        />
        <Content className={style['quickorder-form']} style={{ display: remarkShow ? 'none' : 'block' }}>
          <List>
            <InputItem
              {...getFieldProps('title', {
                rules: [
                  { required: true, message: '请输入标题' },
                  { pattern: /^.{5,30}$/, message: '标题字数5~30字' }
                ],
                initialValue: edittype === '1' ? bidsData['title'] : ''
              })}
              clear
              error={!!getFieldError('title')}
              onErrorClick={() => this.onErrorClick('title')}
              placeholder='请输入标题'
            >标 题<em className={style['asterisk']}>*</em></InputItem>
            {
              bidwayId === '1' ? <InputItem
                {...getFieldProps('tender_amount', {
                  rules: [
                    { required: true, message: '请输入总价' },
                    { pattern: /^[1-9]|([1-9][0-9]+)$/, message: '总价需要大于1' }
                  ],
                  initialValue: edittype === '1' ? Number(bidsData['tender_amount']) / 100 : ''
                })}
                type='digit'
                extra='元'
                clear
                error={!!getFieldError('tender_amount')}
                onErrorClick={() => this.onErrorClick('tender_amount')}
                placeholder='请输入总价'
              >总价<em className={style['asterisk']}>*</em></InputItem> : null
            }
            <DatePicker
              mode='date'
              minDate={new Date()}
              title='截标时间'
              extra={getFieldError('bid_end_time') ? <div className='colorRed'>未选择</div> : '请选择截标时间'}
              value={startDate}
              onOk={(date) => this.handleStartDate(date)}
              {...getFieldProps('bid_end_time', {
                rules: [
                  { required: true, message: '请选择截标时间' }
                ],
                initialValue: edittype === '1' && bidsData['bid_end_time'] ? new Date(Date.parse(bidsData['bid_end_time'].replace(/-/g, '/'))) : ''
              })}
            >
              <Item arrow='horizontal'>截标时间<em className={style['asterisk']}>*</em></Item>
            </DatePicker>
            <DatePicker
              mode='date'
              minDate={new Date()}
              maxDate={endDate}
              title='开工时间'
              extra={getFieldError('start_time') ? <div className='colorRed'>未选择</div> : '请选择开工时间'}
              value={startDate}
              onOk={(date) => this.handleStartDate(date)}
              {...getFieldProps('start_time', {
                rules: [
                  { required: true, message: '请选择开工时间' }
                ],
                initialValue: edittype === '1' && bidsData['start_time'] ? new Date(Date.parse(bidsData['start_time'].replace(/-/g, '/'))) : ''
              })}
            >
              <Item arrow='horizontal'>开工时间<em className={style['asterisk']}>*</em></Item>
            </DatePicker>
            <DatePicker
              mode='date'
              minDate={startDate || new Date()}
              title='结束时间'
              extra={getFieldError('end_time') ? <div className='colorRed'>未选择</div> : '请选择结束时间'}
              value={endDate}
              onOk={(date) => this.handleEndDate(date)}
              {...getFieldProps('end_time', {
                rules: [
                  { required: true, message: '请选择结束时间' }
                ],
                initialValue: edittype === '1' && bidsData['end_time'] ? new Date(Date.parse(bidsData['end_time'].replace(/-/g, '/'))) : ''
              })}
            >
              <Item arrow='horizontal'>结束时间<em className={style['asterisk']}>*</em></Item>
            </DatePicker>
            <div className={style['input-ellipsis']} onClick={this.handleSelectMap}>
              <Item arrow='horizontal' extra={getFieldError('construction_place') ? <div className='colorRed'>未选择</div> : address}>施工地址<em className={style['asterisk']}>*</em></Item>
              <div style={{ display: 'none' }}>
                <InputItem
                  {...getFieldProps('construction_place', {
                    rules: [
                      { required: true, message: '请选择施工地址' }
                    ],
                    initialValue: edittype === '1' ? bidsData['construction_place'] : ''
                  })}
                />
              </div>
            </div>
            <InputItem
              {...getFieldProps('tender_contract', {
                initialValue: edittype === '1' ? bidsData['tender_contract'] : ''
              })}
              clear
              error={!!getFieldError('tender_contract')}
              onErrorClick={() => this.onErrorClick('tender_contract')}
              placeholder='请输入联系人'
            >联系人</InputItem>
            <InputItem
              {...getFieldProps('tender_contract_way', {
                rules: [
                  { pattern: /^1[345789]\d{9}$/, message: '手机号格式错误' }
                ],
                initialValue: edittype === '1' ? bidsData['tender_contract_way'] : ''
              })}
              clear
              error={!!getFieldError('tender_contract_way')}
              onErrorClick={() => this.onErrorClick('tender_contract_way')}
              placeholder='请输入手机号'
            >手机号</InputItem>
            <div className={style['input-ellipsis']} onClick={this.handleRemarkClick}>
              <Item arrow='horizontal' extra={remark}>工单备注</Item>
            </div>
          </List>
          <WingBlank><Button onClick={this.onSubmit} className={style['push-btn']} type='primary'>{edittype === '1' ? '保存招标' : '发布招标'}</Button></WingBlank>
          <WhiteSpace />
        </Content>
        <Content style={{ display: remarkShow ? 'block' : 'none' }}>
          <div>
            <TextareaItem
              {...getFieldProps('remark', {
                initialValue: edittype === '1' ? bidsData['remark'] : '',
                rules: [
                  { pattern: /^.{20,500}$/, message: '描述字数为20~500字' }
                ],
              })}
              placeholder='描述你招标的具体要求，能更快找到合作方，如：招标范围、招标组织形式、招标方式等（至少20个字）'
              error={!!getFieldError('remark')}
              onErrorClick={() => this.onErrorClick('remark')}
              rows={4}
              count={500}
            />
          </div>
          <div className={`${style['push-form-upload']}`}>
            <p className={style['push-title']}>附件</p>
            {
              'cordova' in window ? <div onClick={this.handleCordovaImg}><NewIcon type='icon-upload' className={style['push-upload-icon']} /></div> : <Upload {...uploaderProps} ><NewIcon type='icon-upload' className={style['push-upload-icon']} /></Upload>
            }
            <ul className={style['file-list']}>
              {
                fileList.map((item, index, ary) => {
                  return (
                    <li key={index} className='my-bottom-border'><NewIcon type='icon-paperclip' className={style['file-list-icon']}/><a>{edittype === '1' ? item.name : item.org_name}</a><i onClick={() => { this.delUploadList(item) }}>&#10005;</i></li>
                  )
                })
              }
            </ul>
          </div>
        </Content>
      </div>
      {
        mapShow ? <Address title='施工地址' onClose={() => this.closeAddress()} onSubmit={(mapJson) => this.submitAddress(mapJson)} /> : null
      }
    </div>
  }
}

export default createForm()(FormBox)
