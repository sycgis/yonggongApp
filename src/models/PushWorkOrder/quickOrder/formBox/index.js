import React, { Component } from 'react'
import { List, Toast, InputItem, Picker, Flex, DatePicker, TextareaItem, WingBlank, Button, WhiteSpace } from 'antd-mobile'
import Loadable from 'react-loadable'
import { Header, Content } from 'Components'
import * as urls from 'Contants/urls'
import * as tooler from 'Contants/tooler'
import { createForm } from 'rc-form'
import NewIcon from 'Components/NewIcon'
import api from 'Util/api'
import style from './index.css'
import Address from 'Components/Address'
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
      valuationUnit: '',
      chargeSizeData: [],
      urlJson: tooler.parseURLParam(),
      remark: ''
    }
  }
  componentDidMount() {
    document.removeEventListener('backbutton', onBackKeyDown, false)
    document.addEventListener('backbutton', this.backButtons, false)
    this.getValuationUnit()
  }
  componentWillUnmount () {
    document.removeEventListener('backbutton', this.backButtons)
    document.addEventListener('backbutton', onBackKeyDown, false)
  }
  backButtons = (e) => {
    let { remarkShow, mapShow } = this.state
    if (remarkShow) {
      e.preventDefault()
      this.setState({
        remarkShow: false
      })
    } else if (mapShow) {
      e.preventDefault()
      this.setState({
        mapShow: false
      })
    } else {
      this.props.match.history.push(urls.PUSHQUICKORDER + '?' + tooler.parseJsonUrl(this.state.urlJson))
    }
  }
  getValuationUnit = async () => {
    let { settleValue } = this.state.urlJson
    let data = await api.Common.getUnitlist({
      type: settleValue,
      worksheet_type: 3
    })
    let newData = []
    data.map(item => {
      newData.push({
        label: '元/' + item['label'],
        value: item['value']
      })
    })
    this.setState({
      chargeSizeData: newData
    })
  }
  handleRemarkClick = () => {
    this.setState({
      remarkShow: true
    })
  }
  onErrorClick = (field) => {
    Toast.info(this.props.form.getFieldError(field).join('、'))
  }
  delUploadList = async (param) => { // 删除附件
    const { fileList } = this.state
    let newFileList = []
    fileList.map((item) => {
      if (item.path !== param['path']) {
        newFileList.push(item)
      }
    })
    const data = await api.Common.delAttch({
      path: param['path']
    }) || false
    if (data) {
      this.setState({
        fileList: newFileList
      })
    }
  }
  handleSelectMap = () => {
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
    let { classifyId, constructType, teachId, proId, orderno } = this.state.urlJson
    let attachment = []
    fileList.map(item => {
      attachment.push(item['path'])
    })
    this.props.form.validateFields({ force: true }, async (error) => {
      if (!error) {
        let formJson = this.props.form.getFieldsValue()
        let repush = {}
        if (orderno !== '' && typeof orderno !== 'undefined') {
          repush = {
            p_order_no: orderno
          }
        }
        let postJson = {
          ...{ worksheet_type: 3 },
          ...formJson,
          ...{ prj_no: proId },
          ...repush,
          ...{ start_time: tooler.formatDate(formJson['start_time']), end_time: tooler.formatDate(formJson['end_time']) },
          ...{ valuation_unit: formJson['valuation_unit'][0] },
          ...{ coordinate: { lng: addressObj.position.lng, lat: addressObj.position.lat }},
          ...{ city_code: addressObj.position.cityCode },
          ...{ construct_ids: [classifyId] },
          ...{ construct_type: constructType },
          ...{ professional_level: teachId !== 'null' ? teachId : '' },
          attachment
        }
        console.log(postJson)
        Toast.loading('提交中...', 0)
        let data = await api.PushOrder.quick(postJson) || false
        if (data) {
          Toast.hide()
          Toast.success('发布成功', 1, () => {
            this.props.match.history.push(`${urls.QKORDERRESULT}?worksheetno=${data['worksheet_no']}`)
          })
        }
      }
    })
  }
  render() {
    console.log(this.state)
    const { getFieldProps, getFieldError, getFieldValue } = this.props.form
    let { fileList, remarkShow, startDate, endDate, mapShow, address, valuationUnit, chargeSizeData, remark } = this.state
    console.log('fileList:', fileList)
    let { settleValue, starttime, orderno } = this.state.urlJson
    const uploaderProps = {
      action: api.Common.uploadFile,
      data: { type: 3 },
      multiple: false,
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
    let qtyUnit = ''
    if (chargeSizeData.length !== 0 && valuationUnit !== '') {
      qtyUnit = chargeSizeData.find(item => {
        return item['value'] === valuationUnit[0]
      })['label']
    }
    return <div>
      <div className='pageBox gray' style={{ display: mapShow ? 'none' : 'block' }}>
        <Header
          title={remarkShow ? '快单备注' : '发布快单'}
          leftIcon='icon-back'
          leftTitle1='返回'
          leftClick1={() => {
            if (remarkShow) {
              this.setState({ remarkShow: false })
            } else {
              let { urlJson } = this.state
              console.log('parseurl:', tooler.parseJsonUrl(urlJson))
              this.props.match.history.push(urls.PUSHQUICKORDER + '?' + tooler.parseJsonUrl(urlJson))
            }
          }}
          rightTitle={remarkShow ? '确认' : null}
          rightClick={() => {
            let bool = !!getFieldError('count')
            bool ? Toast.info(getFieldError('count').join('、')) : this.setState({ remarkShow: false, remark: getFieldValue('remark') })
          }}
        />
        <Content className={style['quickorder-form']} style={{ display: remarkShow ? 'none' : 'block' }}>
          <List>
            <div>
              <InputItem
                {...getFieldProps('title', {
                  rules: [
                    { required: true, message: '请输入标题' },
                    { pattern: /^.{5,30}$/, message: '标题字数5~30字' }
                  ],
                })}
                clear
                error={!!getFieldError('title')}
                onErrorClick={() => this.onErrorClick('title')}
                placeholder='请输入标题'
              >标 题<em className={style['asterisk']}>*</em></InputItem>
            </div>
            <div className={`${style['push-form']}`}>
              <InputItem
                {...getFieldProps('people_number', {
                  rules: [
                    { required: true, message: '请输入人数' },
                    { pattern: /^[0-9]*[1-9][0-9]*$/, message: '人数格式错误' }
                  ],
                })}
                type='digit'
                clear
                error={!!getFieldError('people_number')}
                onErrorClick={() => this.onErrorClick('people_number')}
                placeholder='请输入人数'
              >人 数<em className={style['asterisk']}>*</em></InputItem>
              <Flex justify='between'>
                <InputItem
                  {...getFieldProps('valuation_unit_price', {
                    rules: [
                      { required: true, message: '请输入单价' },
                      { pattern: /^[1-9]|([1-9][0-9]+)$/, message: '单价需要大于1元' }
                    ],
                  })}
                  type='digit'
                  clear
                  error={!!getFieldError('valuation_unit_price')}
                  onErrorClick={() => this.onErrorClick('valuation_unit_price')}
                  placeholder='请输入单价'
                >单 价<em className={style['asterisk']}>*</em></InputItem>
                <span className={style['vertical-line']}></span>
                <Picker
                  className={style['charge-unit']}
                  data={ chargeSizeData }
                  extra={getFieldError('valuation_unit') ? <div className='colorRed'>未选择计价单位</div> : '请选择计价单位'}
                  cols={1}
                  value={ valuationUnit }
                  onOk={ value => this.setState({ valuationUnit: value })}
                  {...getFieldProps('valuation_unit', {
                    rules: [
                      { required: true, message: '请选择计价单位' }
                    ],
                    valuePropName: 'checked'
                  })}
                >
                  <Item></Item>
                </Picker>
              </Flex>
              {
                settleValue === '1' ? <InputItem
                  {...getFieldProps('valuation_quantity', {
                    rules: [
                      { required: true, message: '请输入工作总量' },
                      { pattern: /^[1-9]|([1-9][0-9]+)$/, message: '工作总量需要大于1' }
                    ],
                  })}
                  type='digit'
                  extra={ qtyUnit ? qtyUnit.split('/')[1] : '' }
                  clear
                  error={!!getFieldError('valuation_quantity')}
                  onErrorClick={() => this.onErrorClick('valuation_quantity')}
                  placeholder='请输入工作总量'
                >工作总量<em className={style['asterisk']}>*</em></InputItem> : null
              }
            </div>
            <div>
              <DatePicker
                mode='date'
                minDate={orderno !== '' && typeof starttime !== 'undefined' ? new Date(Date.parse(starttime.replace(/-/g, '/'))) : new Date()}
                maxDate={endDate}
                title='开工时间'
                extra={getFieldError('start_time') ? <div className='colorRed'>未选择</div> : '请选择开工时间'}
                value={startDate}
                onOk={(date) => this.handleStartDate(date)}
                {...getFieldProps('start_time', {
                  rules: [
                    { required: true, message: '请选择开工时间' }
                  ],
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
                })}
              >
                <Item arrow='horizontal'>结束时间<em className={style['asterisk']}>*</em></Item>
              </DatePicker>
            </div>
            <div className={style['input-ellipsis']} onClick={this.handleSelectMap}>
              <Item arrow='horizontal' extra={getFieldError('construction_place') ? <div className='colorRed'>未选择</div> : address}>施工地址<em className={style['asterisk']}>*</em></Item>
              <div style={{ display: 'none' }}>
                <InputItem
                  {...getFieldProps('construction_place', {
                    rules: [
                      { required: true, message: '请选择施工地址' }
                    ],
                  })}
                />
              </div>
            </div>
            <div className={style['input-ellipsis']} onClick={this.handleRemarkClick}>
              <Item arrow='horizontal' extra={remark}>快单备注</Item>
            </div>
          </List>
          <WingBlank><Button onClick={this.onSubmit} className={style['push-btn']} type='primary'>发布快单</Button></WingBlank>
          <WhiteSpace />
        </Content>
        <Content style={{ display: remarkShow ? 'block' : 'none' }}>
          <div>
            <TextareaItem
              {...getFieldProps('remark', {
                initialValue: '',
                rules: [
                  { pattern: /^.{20,500}$/, message: '描述字数为20~500字' }
                ],
              })}
              placeholder='描述你快单的具体要求，能更快找到合适你的工人，如：工作环境、工作要求等（至少20个字）'
              error={!!getFieldError('remark')}
              onErrorClick={() => this.onErrorClick('remark')}
              rows={4}
              count={500}
            />
          </div>
          <div className={`${style['push-form-upload']}`}>
            <p className={style['push-title']}>附件</p>
            <Upload {...uploaderProps} ><NewIcon type='icon-upload' className={style['push-upload-icon']} /></Upload>
            <ul className={style['file-list']}>
              {
                fileList.map((item, index, ary) => {
                  return (
                    <li key={index} className='my-bottom-border'><NewIcon type='icon-paperclip' className={style['file-list-icon']}/><a>{item.org_name}</a><i onClick={() => { this.delUploadList(item) }}>&#10005;</i></li>
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