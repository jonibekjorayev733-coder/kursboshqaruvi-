import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type SectionTitleProps = {
  title: string;
  caption?: string;
};

export function SectionTitle({ title, caption }: SectionTitleProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  caption: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
