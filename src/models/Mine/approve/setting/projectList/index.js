import React, { Component } from 'react'
import { List, Radio, Toast } from 'antd-mobile'
import { Header, Content, DefaultPage } from 'Components'
import * as urls from 'Contants/urls'
import api from 'Util/api'

const RadioItem = Radio.RadioItem
class ClassifyList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      value: '',
      datasource: [],
      isloading: true
    }
  }
  onChange = (value) => {
    this.setState({
      value
    })
  }
  componentDidMount() {
    this.getClassifyList()
    if (this.props.data) {
      this.setState({
        value: parseInt(this.props.data['proId']) || ''
      })
    }
    console.log(this.props.data)
  }
  getClassifyList = async () => {
    this.setState({
      isloading: true
    })
    let data = await api.Mine.approve.projectAddList({
      limit: 200,
      page: 1
    }) || []
    if (data) {
      this.setState({
        datasource: data,
        isloading: false
      })
    }
  }
  onSubmit = () => {
    let { value, datasource } = this.state
    if (value === '' || datasource.length === 0) {
      Toast.offline('未选择项目或暂无项目', 2)
    } else {
      let checkJson = datasource.find(item => {
        return item['prj_no'] === value
      })
      this.props.onSubmit(checkJson)
    }
  }
  render() {
    let { value, datasource, isloading } = this.state
    return <div className='pageBox gray'>
      <Header
        title='选择项目'
        leftIcon='icon-back'
        leftTitle1='返回'
        leftClick1={() => {
          this.props.onClose()
        }}
        rightTitle='提交'
        rightClick = {this.onSubmit}
      />
      <Content>
        {
          datasource.length !== 0 && !isloading ? <List renderHeader={() => '请选择需要添加的项目'}>
            {datasource.map(i => (
              <RadioItem key={i['prj_no']} checked={value === i['prj_no']} onChange={() => this.onChange(i['prj_no'])}>
                {i['prj_name']}
              </RadioItem>
            ))}
          </List> : datasource.length === 0 && !isloading ? <DefaultPage click={() => { this.props.match.history.push(urls.CREATEPROJECT) }} type='noitems' /> : ''
        }
      </Content>
    </div>
  }
}

export default ClassifyList
