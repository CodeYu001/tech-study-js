import { refreshScheduleTask } from '../controller/schedule';
import { createTip } from '../controller/tip';
import { mainStore } from '../store';
import { Schedule, SettingType } from '../types';
import { ref, Ref, watchEffectRef } from '../utils/composition';
import {
  $$,
  createElementNode,
  createNSElementNode,
  createTextNode,
} from '../utils/element';
import { formatDateNum } from '../utils/time';
import { ScheduleList } from './ScheduleList';
import { TimeInput } from './TimeInput';

/**
 * @description 定时任务组件
 * @returns
 */
function SchedulePanel({
  scheduleList,
  show,
}: {
  scheduleList: Schedule[];
  show: Ref<boolean>;
}) {
  // token
  let token = '';
  // 小时
  let hour = ref(-1);
  // 分钟
  let minute = ref(-1);
  return createElementNode(
    'div',
    undefined,
    {
      class: watchEffectRef(
        show,
        () => `egg_schedule${show.value ? ' active' : ''}`
      ),
    },
    [
      mainStore.settings[SettingType.REMOTE_PUSH]
        ? createElementNode(
            'div',
            undefined,
            { class: 'egg_schedule_token_wrap' },
            [
              createElementNode(
                'div',
                undefined,
                { class: 'egg_schedule_token' },
                [
                  createElementNode(
                    'div',
                    undefined,
                    { class: 'egg_schedule_label' },
                    createTextNode('我的 token')
                  ),
                  createElementNode('input', undefined, {
                    class: 'egg_schedule_token_input',
                    placeholder: '用户 token',
                    maxlength: 32,
                    value: mainStore.pushToken,
                    onfocus: (e: Event) => {
                      const input = <HTMLInputElement>e.target;
                      input.classList.add('active');
                      const btnWrap = $$('.egg_schedule_submit_btn_wrap')[0];
                      btnWrap.classList.add('active');
                    },
                    onblur: (e: Event) => {
                      const input = <HTMLInputElement>e.target;
                      // 去除空格
                      const value = input.value.trim();
                      if (/^[0-9a-z]{32}$/.test(value)) {
                        token = value;
                        input.value = value;
                      } else {
                        token = '';
                      }
                      input.classList.remove('active');
                      setTimeout(() => {
                        const btnWrap = $$('.egg_schedule_submit_btn_wrap')[0];
                        btnWrap.classList.remove('active');
                        input.value = mainStore.pushToken;
                      }, 100);
                    },
                  }),
                ]
              ),
              createElementNode(
                'div',
                undefined,
                { class: 'egg_schedule_submit_btn_wrap' },
                createElementNode(
                  'button',
                  undefined,
                  {
                    class: 'egg_schedule_submit_btn',
                    onclick: () => {
                      // 创建提示
                      createTip('用户 token 已保存!');
                      if (token !== mainStore.pushToken) {
                        mainStore.pushToken = token;
                        // 存储
                        GM_setValue('pushToken', token);
                      }
                    },
                  },
                  createTextNode('保存')
                )
              ),
            ]
          )
        : undefined,
      mainStore.settings[SettingType.SCHEDULE_RUN]
        ? createElementNode('div', undefined, { class: 'egg_schedule_add' }, [
            createElementNode(
              'div',
              undefined,
              { class: 'egg_schedule_time_wrap' },
              [
                createElementNode(
                  'div',
                  undefined,
                  { class: 'egg_schedule_time' },
                  [
                    createElementNode(
                      'div',
                      undefined,
                      { class: 'egg_schedule_label' },
                      createTextNode('设置时间')
                    ),
                    createElementNode(
                      'div',
                      undefined,
                      { class: 'egg_schedule_time_input_wrap' },
                      [
                        TimeInput({
                          hour,
                          minute,
                        }),
                        createElementNode(
                          'button',
                          undefined,
                          {
                            class: 'egg_schedule_add_btn',
                            onclick: () => {
                              // 定时刷新
                              if (
                                !mainStore.settings[SettingType.SCHEDULE_RUN]
                              ) {
                                createTip('未开启定时刷新!');
                                return;
                              }
                              if (hour.value === -1 || minute.value === -1) {
                                createTip('时间格式不符合要求!');
                                return;
                              }
                              // 重复定时存在
                              const exists = scheduleList.find(
                                (schedule) =>
                                  schedule.hour === hour.value &&
                                  schedule.minute === minute.value
                              );
                              if (exists) {
                                createTip('设置定时任务重复!');
                                return;
                              }
                              createTip('设置定时任务成功!');
                              // 添加
                              scheduleList.push({
                                hour: hour.value,
                                minute: minute.value,
                                time: `${formatDateNum(
                                  hour.value
                                )}:${formatDateNum(minute.value)}`,
                              });
                              // 排序
                              scheduleList.sort((a, b) =>
                                a.hour === b.hour
                                  ? a.minute - b.minute
                                  : a.hour - b.hour
                              );
                              // 存储
                              GM_setValue(
                                'scheduleList',
                                JSON.stringify(scheduleList)
                              );
                              // 清空
                              hour.value = -1;
                              minute.value = -1;
                              const inputs = $$<HTMLInputElement>(
                                '.egg_time_input input'
                              );
                              inputs.forEach((i) => (i.value = ''));
                              // 重新渲染
                              const list = $$('.egg_schedule_list')[0];
                              const scheduleAdd = $$('.egg_schedule_add')[0];
                              list.remove();
                              scheduleAdd.append(
                                ScheduleList({ scheduleList })
                              );
                              // 刷新任务
                              refreshScheduleTask();
                            },
                          },
                          createNSElementNode(
                            'svg',
                            undefined,
                            {
                              viewBox: '0 0 1024 1024',
                              class: 'egg_icon',
                            },
                            createNSElementNode('path', undefined, {
                              d: 'M801.171 483.589H544V226.418c0-17.673-14.327-32-32-32s-32 14.327-32 32v257.171H222.83c-17.673 0-32 14.327-32 32s14.327 32 32 32H480v257.17c0 17.673 14.327 32 32 32s32-14.327 32-32v-257.17h257.171c17.673 0 32-14.327 32-32s-14.327-32-32-32z',
                            })
                          )
                        ),
                      ]
                    ),
                  ]
                ),
              ]
            ),
            ScheduleList({ scheduleList }),
          ])
        : undefined,
    ]
  );
}

export { SchedulePanel };
