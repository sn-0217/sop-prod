package com.kwgroup.sopdocument;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class SopDocumentApplicationTests {

	@Test
	void contextLoads() {
	}

	@Test
	void testTimezoneIsIST() {
		java.util.TimeZone timeZone = java.util.TimeZone.getDefault();
		org.junit.jupiter.api.Assertions.assertEquals("Asia/Kolkata", timeZone.getID(),
				"Timezone should be Asia/Kolkata");
	}

}
